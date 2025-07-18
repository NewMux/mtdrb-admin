import { supabase } from '../supabaseClient';
import { 
  VatTransaction, 
  VatReturn, 
  VatReturnLineItem, 
  VatComplianceAudit, 
  GccVatRate,
  VatDashboardData,
  VatReportFilters,
  VatReportData,
  VatRate
} from '../types';

// =============================================
// VAT Dashboard & Analytics
// =============================================

export const getVatDashboardData = async (tenantId: string): Promise<VatDashboardData> => {
  try {
    // Get current period data (current month)
    const currentDate = new Date();
    const currentPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get previous period data
    const previousPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Fetch VAT transactions for current period
    const { data: currentTransactions, error: currentError } = await supabase
      .from('vat_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', currentPeriodStart.toISOString().split('T')[0])
      .lte('date', currentPeriodEnd.toISOString().split('T')[0]);

    if (currentError) throw currentError;

    // Fetch VAT transactions for previous period
    const { data: previousTransactions, error: previousError } = await supabase
      .from('vat_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', previousPeriodStart.toISOString().split('T')[0])
      .lte('date', previousPeriodEnd.toISOString().split('T')[0]);

    if (previousError) throw previousError;

    // Calculate current period totals
    const currentVatCollected = currentTransactions
      ?.filter(t => t.type === 'Invoice')
      .reduce((sum, t) => sum + (t.vat_amount || 0), 0) || 0;
    
    const currentVatPaid = currentTransactions
      ?.filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (t.vat_amount || 0), 0) || 0;

    // Calculate previous period totals
    const previousVatCollected = previousTransactions
      ?.filter(t => t.type === 'Invoice')
      .reduce((sum, t) => sum + (t.vat_amount || 0), 0) || 0;

    // Calculate growth percentage
    const vatGrowthPercentage = previousVatCollected > 0 
      ? ((currentVatCollected - previousVatCollected) / previousVatCollected) * 100 
      : 0;

    // Get overdue returns
    const { data: overdueReturns, error: overdueError } = await supabase
      .from('vat_returns')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'draft')
      .lt('due_date', currentDate.toISOString().split('T')[0]);

    if (overdueError) throw overdueError;

    // Get upcoming deadlines (next 30 days)
    const nextMonth = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data: upcomingDeadlines, error: upcomingError } = await supabase
      .from('vat_returns')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'draft')
      .gte('due_date', currentDate.toISOString().split('T')[0])
      .lte('due_date', nextMonth.toISOString().split('T')[0]);

    if (upcomingError) throw upcomingError;

    // Get VAT by country
    const { data: vatByCountry, error: countryError } = await supabase
      .rpc('get_vat_dashboard_data', { p_tenant_id: tenantId });

    if (countryError) throw countryError;

    // Get recent transactions
    const { data: recentTransactions, error: recentError } = await supabase
      .from('vat_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    // Calculate compliance score
    const { data: complianceScore, error: complianceError } = await supabase
      .rpc('calculate_vat_compliance_score', { 
        p_tenant_id: tenantId, 
        p_country_code: 'BH' // Default to Bahrain
      });

    if (complianceError) throw complianceError;

    // Generate compliance alerts
    const complianceAlerts = [];
    
    if (overdueReturns?.length > 0) {
      complianceAlerts.push({
        type: 'error' as const,
        message: `${overdueReturns.length} VAT return(s) overdue`,
        action_required: true
      });
    }

    if (upcomingDeadlines?.length > 0) {
      complianceAlerts.push({
        type: 'warning' as const,
        message: `${upcomingDeadlines.length} VAT return(s) due soon`,
        action_required: true
      });
    }

    if (complianceScore < 80) {
      complianceAlerts.push({
        type: 'warning' as const,
        message: 'VAT compliance score below 80%',
        action_required: true
      });
    }

    return {
      totalVatCollected: currentVatCollected,
      totalVatPaid: currentVatPaid,
      netVatPayable: currentVatCollected - currentVatPaid,
      complianceScore: complianceScore || 100,
      
      currentPeriodVat: currentVatCollected,
      previousPeriodVat: previousVatCollected,
      vatGrowthPercentage,
      
      overdueReturns: overdueReturns?.length || 0,
      upcomingDeadlines: upcomingDeadlines?.length || 0,
      criticalIssues: complianceAlerts.filter(a => a.type === 'error').length,
      
      vatByCountry: vatByCountry || [],
      recentTransactions: recentTransactions || [],
      complianceAlerts
    };
  } catch (error) {
    console.error('Error fetching VAT dashboard data:', error);
    throw error;
  }
};

// =============================================
// VAT Returns Management
// =============================================

export const generateVatReturn = async (
  tenantId: string,
  countryCode: string,
  periodStart: string,
  periodEnd: string,
  filingPeriod: 'monthly' | 'quarterly' | 'annual'
): Promise<VatReturn> => {
  try {
    const { data, error } = await supabase
      .rpc('generate_vat_return', {
        p_tenant_id: tenantId,
        p_country_code: countryCode,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_filing_period: filingPeriod
      });

    if (error) throw error;

    // Fetch the generated return
    const { data: returnData, error: fetchError } = await supabase
      .from('vat_returns')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) throw fetchError;

    return returnData;
  } catch (error) {
    console.error('Error generating VAT return:', error);
    throw error;
  }
};

export const getVatReturns = async (
  tenantId: string,
  filters?: {
    countryCode?: string;
    status?: string;
    dateRange?: [string, string];
  }
): Promise<VatReturn[]> => {
  try {
    let query = supabase
      .from('vat_returns')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters?.countryCode) {
      query = query.eq('country_code', filters.countryCode);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateRange) {
      query = query
        .gte('return_period_start', filters.dateRange[0])
        .lte('return_period_end', filters.dateRange[1]);
    }

    const { data, error } = await query.order('return_period_start', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching VAT returns:', error);
    throw error;
  }
};

export const submitVatReturn = async (returnId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('vat_returns')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: userId
      })
      .eq('id', returnId);

    if (error) throw error;
  } catch (error) {
    console.error('Error submitting VAT return:', error);
    throw error;
  }
};

// =============================================
// VAT Transactions Management
// =============================================

export const getVatTransactions = async (
  tenantId: string,
  filters?: VatReportFilters
): Promise<VatTransaction[]> => {
  try {
    let query = supabase
      .from('vat_transactions')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters?.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      query = query
        .gte('date', filters.dateRange[0].toISOString().split('T')[0])
        .lte('date', filters.dateRange[1].toISOString().split('T')[0]);
    }

    if (filters?.countryCode) {
      query = query.eq('country_code', filters.countryCode);
    }

    if (filters?.transactionType) {
      query = query.eq('type', filters.transactionType);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.vatRate !== undefined) {
      query = query.eq('vat_rate', filters.vatRate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching VAT transactions:', error);
    throw error;
  }
};

// =============================================
// VAT Compliance & Auditing
// =============================================

export const getVatComplianceAudit = async (
  tenantId: string,
  countryCode: string
): Promise<VatComplianceAudit | null> => {
  try {
    const { data, error } = await supabase
      .from('vat_compliance_audit')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('country_code', countryCode)
      .eq('status', 'active')
      .order('audit_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    console.error('Error fetching VAT compliance audit:', error);
    throw error;
  }
};

export const runVatComplianceCheck = async (
  tenantId: string,
  countryCode: string
): Promise<VatComplianceAudit> => {
  try {
    // Calculate compliance score
    const { data: score, error: scoreError } = await supabase
      .rpc('calculate_vat_compliance_score', {
        p_tenant_id: tenantId,
        p_country_code: countryCode
      });

    if (scoreError) throw scoreError;

    // Check for issues
    const issues = [];
    const criticalIssues = [];

    // Check for overdue returns
    const { data: overdueReturns } = await supabase
      .from('vat_returns')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('country_code', countryCode)
      .eq('status', 'draft')
      .lt('due_date', new Date().toISOString().split('T')[0]);

    if (overdueReturns && overdueReturns.length > 0) {
      criticalIssues.push(`${overdueReturns.length} overdue VAT returns`);
    }

    // Check for missing VAT transactions
    const { data: missingTransactions } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('vat_total', 0)
      .not('id', 'in', `(
        SELECT DISTINCT reference_id 
        FROM vat_transactions 
        WHERE tenant_id = '${tenantId}' 
        AND country_code = '${countryCode}'
        AND type = 'Invoice'
      )`);

    if (missingTransactions && missingTransactions.length > 0) {
      issues.push(`${missingTransactions.length} invoices missing VAT transactions`);
    }

    // Create or update audit record
    const auditData = {
      tenant_id: tenantId,
      country_code: countryCode,
      audit_date: new Date().toISOString().split('T')[0],
      compliance_score: score || 100,
      issues_found: issues.length + criticalIssues.length,
      critical_issues: criticalIssues.length,
      recommendations: [
        ...criticalIssues.map(issue => `CRITICAL: ${issue}`),
        ...issues.map(issue => `Review: ${issue}`),
        score < 80 ? 'Consider VAT compliance training' : 'Maintain current compliance practices'
      ],
      status: 'active'
    };

    const { data, error } = await supabase
      .from('vat_compliance_audit')
      .upsert(auditData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error running VAT compliance check:', error);
    throw error;
  }
};

// =============================================
// GCC VAT Rates Management
// =============================================

export const getGccVatRates = async (): Promise<GccVatRate[]> => {
  try {
    const { data, error } = await supabase
      .from('gcc_vat_rates')
      .select('*')
      .eq('is_active', true)
      .order('country_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching GCC VAT rates:', error);
    throw error;
  }
};

export const getVatRateForCountry = async (countryCode: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('gcc_vat_rates')
      .select('vat_rate')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .lte('effective_from', new Date().toISOString().split('T')[0])
      .or(`effective_to.is.null,effective_to.gt.${new Date().toISOString().split('T')[0]}`)
      .single();

    if (error) throw error;
    return data?.vat_rate || 0;
  } catch (error) {
    console.error('Error fetching VAT rate for country:', error);
    return 0;
  }
};

// =============================================
// Smart VAT Reporting
// =============================================

export const generateVatReport = async (
  tenantId: string,
  filters: VatReportFilters
): Promise<VatReportData> => {
  try {
    // Get transactions based on filters
    const transactions = await getVatTransactions(tenantId, filters);

    // Calculate summary
    const totalVatCollected = transactions
      .filter(t => t.type === 'Invoice')
      .reduce((sum, t) => sum + (t.vat_amount || 0), 0);
    
    const totalVatPaid = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (t.vat_amount || 0), 0);

    const totalTransactions = transactions.length;
    const averageVatRate = totalTransactions > 0 
      ? transactions.reduce((sum, t) => sum + (t.vat_rate || 0), 0) / totalTransactions 
      : 0;

    // Generate breakdowns
    const byCountry = transactions.reduce((acc, t) => {
      const country = t.country_code || 'Unknown';
      const existing = acc.find(item => item.country === country);
      if (existing) {
        existing.amount += t.vat_amount || 0;
        existing.count += 1;
      } else {
        acc.push({ country, amount: t.vat_amount || 0, count: 1 });
      }
      return acc;
    }, [] as { country: string; amount: number; count: number }[]);

    const byType = transactions.reduce((acc, t) => {
      const existing = acc.find(item => item.type === t.type);
      if (existing) {
        existing.amount += t.vat_amount || 0;
        existing.count += 1;
      } else {
        acc.push({ type: t.type, amount: t.vat_amount || 0, count: 1 });
      }
      return acc;
    }, [] as { type: string; amount: number; count: number }[]);

    const byRate = transactions.reduce((acc, t) => {
      const rate = t.vat_rate || 0;
      const existing = acc.find(item => item.rate === rate);
      if (existing) {
        existing.amount += t.vat_amount || 0;
        existing.count += 1;
      } else {
        acc.push({ rate, amount: t.vat_amount || 0, count: 1 });
      }
      return acc;
    }, [] as { rate: number; amount: number; count: number }[]);

    const byMonth = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.amount += t.vat_amount || 0;
        existing.count += 1;
      } else {
        acc.push({ month, amount: t.vat_amount || 0, count: 1 });
      }
      return acc;
    }, [] as { month: string; amount: number; count: number }[]);

    // Get compliance data
    const complianceAudit = await getVatComplianceAudit(tenantId, 'BH'); // Default to Bahrain

    return {
      summary: {
        totalTransactions,
        totalVatCollected,
        totalVatPaid,
        netVatPayable: totalVatCollected - totalVatPaid,
        averageVatRate
      },
      transactions,
      breakdown: {
        byCountry,
        byType,
        byRate,
        byMonth
      },
      compliance: {
        score: complianceAudit?.compliance_score || 100,
        issues: complianceAudit?.recommendations || [],
        recommendations: complianceAudit?.recommendations || []
      }
    };
  } catch (error) {
    console.error('Error generating VAT report:', error);
    throw error;
  }
};

// =============================================
// VAT Export & Download
// =============================================

export const exportVatReport = async (
  tenantId: string,
  filters: VatReportFilters,
  format: 'pdf' | 'excel' | 'csv'
): Promise<string> => {
  try {
    const reportData = await generateVatReport(tenantId, filters);
    
    // TODO: Implement actual export logic
    // This would typically involve:
    // 1. Formatting data for the specific format
    // 2. Generating file (PDF/Excel/CSV)
    // 3. Uploading to storage
    // 4. Returning download URL
    
    console.log('Exporting VAT report:', { format, filters, reportData });
    
    // Placeholder return
    return `vat-report-${Date.now()}.${format}`;
  } catch (error) {
    console.error('Error exporting VAT report:', error);
    throw error;
  }
};

// =============================================
// VAT Automation & Smart Features
// =============================================

export const getVatInsights = async (tenantId: string): Promise<{
  trends: string[];
  recommendations: string[];
  alerts: string[];
}> => {
  try {
    const dashboardData = await getVatDashboardData(tenantId);
    
    const insights = {
      trends: [],
      recommendations: [],
      alerts: []
    };

    // Analyze trends
    if (dashboardData.vatGrowthPercentage > 20) {
      insights.trends.push('Strong VAT growth - consider reviewing pricing strategy');
    } else if (dashboardData.vatGrowthPercentage < -10) {
      insights.trends.push('Declining VAT collections - investigate business performance');
    }

    // Generate recommendations
    if (dashboardData.complianceScore < 90) {
      insights.recommendations.push('Improve VAT compliance by reviewing overdue returns');
    }

    if (dashboardData.overdueReturns > 0) {
      insights.recommendations.push('Submit overdue VAT returns to avoid penalties');
    }

    if (dashboardData.upcomingDeadlines > 0) {
      insights.recommendations.push('Prepare for upcoming VAT return deadlines');
    }

    // Generate alerts
    if (dashboardData.overdueReturns > 0) {
      insights.alerts.push(`CRITICAL: ${dashboardData.overdueReturns} overdue VAT returns`);
    }

    if (dashboardData.complianceScore < 80) {
      insights.alerts.push('LOW COMPLIANCE: VAT compliance score below 80%');
    }

    return insights;
  } catch (error) {
    console.error('Error generating VAT insights:', error);
    throw error;
  }
}; 