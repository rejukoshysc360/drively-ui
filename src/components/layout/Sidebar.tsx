import { NavLink } from 'react-router-dom';

const links = [
  { to: '/organizations', label: 'Organizations' },
  { to: '/clients', label: 'Client Companies' },
  { to: '/employees', label: 'Employees' },
  { to: '/projects', label: 'Projects' },
  { to: '/projects', label: 'Employee Allocation' },
  { to: '/timesheets', label: 'Timesheets' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 border-r bg-white min-h-[calc(100vh-56px)]">
      <div className="p-4 font-semibold">HR Admin</div>
      <nav className="px-2 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
