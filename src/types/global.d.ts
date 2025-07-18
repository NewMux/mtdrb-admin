import { SupabaseClient } from '@supabase/supabase-js';

declare module 'react-big-calendar' {
  export const Calendar: any;
  export const Views: any;
  export const dateFnsLocalizer: any;
  export const withDragAndDrop: any;
}

declare module 'react-big-calendar/lib/addons/dragAndDrop' {
  const withDragAndDrop: any;
  export default withDragAndDrop;
}

declare module 'papaparse' {
  const Papa: any;
  export default Papa;
}

declare global {
  interface Window {
    supabase: any;
  }
}

export {}; 