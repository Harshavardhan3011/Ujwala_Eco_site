import { redirect } from 'next/navigation';

export default function AdminUsersPageRedirect() {
  redirect('/superadmin/users');
}
