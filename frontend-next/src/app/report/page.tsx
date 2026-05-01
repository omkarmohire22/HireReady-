import { redirect } from 'next/navigation';

export default function ReportIndexPage() {
  // Right now, since we don't have a real DB connected, we redirect
  // the generic /report path to our mock session 'demo123'
  redirect('/report/demo123');
}
