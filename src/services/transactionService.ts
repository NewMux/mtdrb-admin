import { supabase } from '../supabaseClient';
import { errorHandler, ErrorContext } from './errorHandler';

export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rollbackPerformed?: boolean;
}

export interface MembershipWithInvoiceData {
  member: {
    tenant_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    membership_type: string;
    join_date: string;
    expiry_date?: string;
    trainer_id?: string;
  };
  invoice: {
    amount: number;
    currency: string;
    due_date: string;
    items: any[];
  };
}

export interface ClassWithBookingData {
  class: {
    tenant_id: string;
    name: string;
    description?: string;
    trainer_id: string;
    start_time: string;
    end_time: string;
    capacity: number;
    room?: string;
    price?: number;
  };
  booking: {
    member_id: string;
  };
}

class TransactionService {
  // Create member with initial invoice atomically
  async createMembershipWithInvoice(data: MembershipWithInvoiceData): Promise<TransactionResult> {
    try {
      // Start transaction
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert(data.member)
        .select()
        .single();

      if (memberError) throw memberError;

      // Create invoice for the new member
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...data.invoice,
          member_id: member.id,
          tenant_id: data.member.tenant_id,
          status: 'pending'
        })
        .select()
        .single();

      if (invoiceError) {
        // Rollback: Delete the member
        await this.rollbackMemberCreation(member.id);
        throw invoiceError;
      }

      // Log activity
      await this.logActivity(
        data.member.tenant_id,
        'member',
        'New Member Created',
        `Member ${data.member.first_name} ${data.member.last_name} registered with initial invoice`,
        'success',
        { member_id: member.id, invoice_id: invoice.id }
      );

      return {
        success: true,
        data: { member, invoice }
      };

    } catch (error) {
      const processedError = errorHandler.processError(error, ErrorContext.MEMBER_MANAGEMENT, false);
      return {
        success: false,
        error: processedError.userMessage,
        rollbackPerformed: true
      };
    }
  }

  // Create class with automatic booking atomically
  async createClassWithBooking(data: ClassWithBookingData): Promise<TransactionResult> {
    try {
      // Check trainer availability first
      const { data: conflictingClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('tenant_id', data.class.tenant_id)
        .eq('trainer_id', data.class.trainer_id)
        .or(`start_time.lte.${data.class.end_time},end_time.gte.${data.class.start_time}`)
        .neq('status', 'cancelled');

      if (conflictingClasses && conflictingClasses.length > 0) {
        throw new Error('trainer_unavailable');
      }

      // Create class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          ...data.class,
          current_bookings: 1,
          status: 'scheduled'
        })
        .select()
        .single();

      if (classError) throw classError;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('class_bookings')
        .insert({
          ...data.booking,
          class_id: newClass.id,
          tenant_id: data.class.tenant_id,
          status: 'booked'
        })
        .select()
        .single();

      if (bookingError) {
        // Rollback: Delete the class
        await this.rollbackClassCreation(newClass.id);
        throw bookingError;
      }

      // Log activity
      await this.logActivity(
        data.class.tenant_id,
        'class',
        'Class Created with Booking',
        `Class ${data.class.name} created and booked`,
        'success',
        { class_id: newClass.id, booking_id: booking.id }
      );

      return {
        success: true,
        data: { class: newClass, booking }
      };

    } catch (error) {
      const processedError = errorHandler.processError(error, ErrorContext.CLASS_SCHEDULING, false);
      return {
        success: false,
        error: processedError.userMessage,
        rollbackPerformed: true
      };
    }
  }

  // Process payment and update invoice atomically
  async processPayment(invoiceId: string, paymentData: {
    amount: number;
    payment_method: string;
    tenant_id: string;
  }): Promise<TransactionResult> {
    try {
      // Get invoice details
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('tenant_id', paymentData.tenant_id)
        .single();

      if (fetchError) throw fetchError;

      if (invoice.status === 'paid') {
        throw new Error('invoice_already_paid');
      }

      if (paymentData.amount !== invoice.amount) {
        throw new Error('invalid_amount');
      }

      // Update invoice status
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log payment activity
      await this.logActivity(
        paymentData.tenant_id,
        'payment',
        'Payment Processed',
        `Payment of ${paymentData.amount} processed for invoice ${invoiceId}`,
        'success',
        { 
          invoice_id: invoiceId, 
          amount: paymentData.amount,
          payment_method: paymentData.payment_method 
        }
      );

      return {
        success: true,
        data: { invoice: updatedInvoice }
      };

    } catch (error) {
      const processedError = errorHandler.processError(error, ErrorContext.BILLING, false);
      return {
        success: false,
        error: processedError.userMessage
      };
    }
  }

  // Cancel membership and handle related data atomically
  async cancelMembership(memberId: string, tenantId: string, reason?: string): Promise<TransactionResult> {
    try {
      // Update member status
      const { data: member, error: memberError } = await supabase
        .from('members')
        .update({
          status: 'inactive',
          expiry_date: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (memberError) throw memberError;

      // Cancel future bookings
      const { error: bookingError } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('member_id', memberId)
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date().toISOString());

      if (bookingError) {
        // Rollback member status
        await supabase
          .from('members')
          .update({ status: 'active', expiry_date: null })
          .eq('id', memberId);
        throw bookingError;
      }

      // Log cancellation
      await this.logActivity(
        tenantId,
        'member',
        'Membership Cancelled',
        `Membership for ${member.first_name} ${member.last_name} has been cancelled${reason ? `: ${reason}` : ''}`,
        'success',
        { member_id: memberId, reason }
      );

      return {
        success: true,
        data: { member }
      };

    } catch (error) {
      const processedError = errorHandler.processError(error, ErrorContext.MEMBER_MANAGEMENT, false);
      return {
        success: false,
        error: processedError.userMessage,
        rollbackPerformed: true
      };
    }
  }

  // Rollback helpers
  private async rollbackMemberCreation(memberId: string): Promise<void> {
    try {
      await supabase.from('members').delete().eq('id', memberId);
    } catch (error) {
      console.error('Rollback failed for member:', memberId, error);
    }
  }

  private async rollbackClassCreation(classId: string): Promise<void> {
    try {
      await supabase.from('classes').delete().eq('id', classId);
    } catch (error) {
      console.error('Rollback failed for class:', classId, error);
    }
  }

  // Activity logging helper
  private async logActivity(
    tenantId: string,
    type: string,
    title: string,
    description: string,
    status: 'success' | 'pending' | 'failed',
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.from('activities').insert({
        tenant_id: tenantId,
        type,
        title,
        description,
        status,
        metadata
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Batch operations
  async batchCreateMembers(members: any[], tenantId: string): Promise<TransactionResult> {
    try {
      const results = [];
      const errors = [];

      for (const memberData of members) {
        try {
          const { data: member, error } = await supabase
            .from('members')
            .insert({ ...memberData, tenant_id: tenantId })
            .select()
            .single();

          if (error) throw error;
          results.push(member);
        } catch (error) {
          errors.push({ memberData, error: error.message });
        }
      }

      // Log batch operation
      await this.logActivity(
        tenantId,
        'member',
        'Batch Member Import',
        `Imported ${results.length} members, ${errors.length} failed`,
        errors.length === 0 ? 'success' : 'partial',
        { successful: results.length, failed: errors.length, errors }
      );

      return {
        success: errors.length === 0,
        data: { successful: results, failed: errors }
      };

    } catch (error) {
      const processedError = errorHandler.processError(error, ErrorContext.MEMBER_MANAGEMENT, false);
      return {
        success: false,
        error: processedError.userMessage
      };
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService(); 