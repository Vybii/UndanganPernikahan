import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const GOLD = '#b8965a';
const SAGE = '#7a9e7e';

const navItems = [
  { id: 'overview', label: 'Overview', icon: '◆' },
  { id: 'guests', label: 'Guest Management', icon: '◇' },
  { id: 'rsvp', label: 'RSVP Management', icon: '✉' },
  { id: 'invitations', label: 'Invitation Links', icon: '⌁' },
  { id: 'checkin', label: 'QR Check-in', icon: '◉' },
  { id: 'analytics', label: 'Analytics', icon: '◈' },
  { id: 'editor', label: 'CMS Editor', icon: '✎' },
  { id: 'theme', label: 'Theme Builder', icon: '◑' },
  { id: 'music', label: 'Music', icon: '♪' },
];

const visitorData = [
  { day: 'Mon', visits: 240, rsvp: 80 },
  { day: 'Tue', visits: 380, rsvp: 120 },
  { day: 'Wed', visits: 290, rsvp: 95 },
  { day: 'Thu', visits: 510, rsvp: 180 },
  { day: 'Fri', visits: 420, rsvp: 140 },
  { day: 'Sat', visits: 680, rsvp: 220 },
  { day: 'Sun', visits: 590, rsvp: 190 },
];

const rsvpData = [
  { name: 'Confirmed', value: 350, color: GOLD },
  { name: 'Pending', value: 100, color: '#c8b090' },
  { name: 'Declined', value: 50, color: '#d4c4b0' },
];

const guests = [
  { name: 'Sari Dewi', phone: '+62 812 3456 7890', category: 'Family', status: 'Confirmed', checkin: 'Checked In' },
  { name: 'Budi Santoso', phone: '+62 813 5678 9012', category: 'Friend', status: 'Confirmed', checkin: 'Not Yet' },
  { name: 'Ahmad Fauzi', phone: '+62 821 9012 3456', category: 'Colleague', status: 'Pending', checkin: 'Not Yet' },
  { name: 'Rina Kusuma', phone: '+62 822 0123 4567', category: 'Family', status: 'Confirmed', checkin: 'Checked In' },
  { name: 'Doni Wijaya', phone: '+62 815 2345 6789', category: 'Friend', status: 'Declined', checkin: 'Not Yet' },
  { name: 'Maya Sari', phone: '+62 819 3456 7890', category: 'Colleague', status: 'Confirmed', checkin: 'Checked In' },
  { name: 'Hendra Putra', phone: '+62 823 4567 8901', category: 'Family', status: 'Pending', checkin: 'Not Yet' },
  { name: 'Lina Permata', phone: '+62 817 5678 9012', category: 'Friend', status: 'Confirmed', checkin: 'Not Yet' },
];

const themes = [
  { name: 'Elegant Gold', colors: ['#b8965a', '#f5ecd8', '#2c2118'] },
  { name: 'Garden Romance', colors: ['#7a9e7e', '#f0f4ef', '#2d3c2e'] },
  { name: 'Minimal White', colors: ['#e0d8cc', '#ffffff', '#333333'] },
  { name: 'Traditional Luxury', colors: ['#8b0000', '#fdf5e6', '#2c1a00'] },
];

const recentActivity = [
  { initials: 'SD', title: 'Sari Dewi confirmed attendance', detail: '2 guests · Family', time: '8 min' },
  { initials: 'BP', title: 'Bima Pratama opened the invitation', detail: 'Personal link · WhatsApp', time: '24 min' },
  { initials: 'MK', title: 'Maya Kusuma left a wedding wish', detail: 'Guestbook moderation', time: '1 hr' },
  { initials: 'AF', title: 'Ahmad Fauzi updated his RSVP', detail: 'Pending → Confirmed', time: '2 hrs' },
];

const planningTasks = [
  { label: 'Confirm final catering count', due: 'Due Nov 01', done: false },
  { label: 'Review guest seating groups', due: 'Due Nov 05', done: false },
  { label: 'Publish venue parking notes', due: 'Completed', done: true },
];

function StatCard({ label, value, change, icon }: { label: string; value: string; change?: string; icon: string }) {
  return (
    <div className="admin-stat-card p-6 rounded-2xl transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="text-2xl" style={{ color: GOLD }}>{icon}</div>
        {change && <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(122,158,126,0.15)', color: SAGE }}>{change}</span>}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>{value}</div>
      <div className="text-xs tracking-wide uppercase" style={{ color: '#ad9a80' }}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState(section || 'overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const daysRemaining = Math.max(0, Math.ceil((new Date('2028-11-16T09:00:00+07:00').getTime() - Date.now()) / 86400000));

  const filteredGuests = guests.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterCategory === 'All' || g.category === filterCategory;
    return matchSearch && matchFilter;
  });

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            <section className="admin-welcome-card">
              <div className="relative z-10 max-w-xl">
                <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#d4b67f' }}>Wedding command center</div>
                <h2 className="text-3xl md:text-4xl mb-3" style={{ color: '#fff8ec' }}>Good morning, Angga & Ayu</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,236,216,0.7)' }}>
                  Your celebration is taking shape beautifully. Here is what needs your attention today.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => setActiveSection('guests')}
                    className="px-4 py-2.5 rounded-lg text-xs tracking-wide"
                    style={{ background: '#c9a568', color: '#241a13' }}
                  >
                    Manage guest list
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2.5 rounded-lg text-xs tracking-wide"
                    style={{ color: '#ead9bd', border: '1px solid rgba(218,185,128,0.4)' }}
                  >
                    Preview invitation
                  </button>
                </div>
              </div>
              <div className="admin-countdown">
                <div className="text-xs tracking-[0.25em] uppercase" style={{ color: '#c9a568' }}>Until “I do”</div>
                <div className="text-5xl md:text-6xl my-2" style={{ fontFamily: 'Playfair Display, serif', color: '#fff8ec' }}>{daysRemaining}</div>
                <div className="text-xs tracking-[0.2em] uppercase" style={{ color: 'rgba(245,236,216,0.55)' }}>days remaining</div>
                <div className="admin-countdown-line"><span /></div>
                <div className="text-xs" style={{ color: 'rgba(245,236,216,0.7)' }}>Thursday, 16 November 2028</div>
              </div>
            </section>

            <div className="row">
              <div className="col s6 l3"><StatCard label="Total Guests" value="500" change="+12%" icon="◆" /></div>
              <div className="col s6 l3"><StatCard label="Invitation Opened" value="420" change="+8%" icon="✉" /></div>
              <div className="col s6 l3"><StatCard label="Confirmed RSVP" value="350" change="+15%" icon="✓" /></div>
              <div className="col s6 l3"><StatCard label="Checked In" value="300" change="Live" icon="◉" /></div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 admin-panel p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase mb-1" style={{ color: GOLD }}>Guest response</div>
                    <h3 className="text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Invitation & RSVP momentum</h3>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#f4efe7', color: '#6d5a45' }}>Last 7 days</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={visitorData}>
                    <defs>
                      <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rsvpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SAGE} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={SAGE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#ad9a80' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#ad9a80' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${GOLD}`, fontSize: '12px' }} />
                    <Area type="monotone" dataKey="visits" stroke={GOLD} strokeWidth={2} fill="url(#visits)" name="Visits" />
                    <Area type="monotone" dataKey="rsvp" stroke={SAGE} strokeWidth={2} fill="url(#rsvpGrad)" name="RSVP" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="admin-panel p-6 rounded-2xl">
                <div className="text-xs tracking-[0.18em] uppercase mb-1" style={{ color: GOLD }}>Attendance</div>
                <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>RSVP status</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={rsvpData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {rsvpData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} guests`]} contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {rsvpData.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span style={{ color: '#d9c5a7' }}>{item.name}</span>
                      </div>
                      <span className="font-medium" style={{ color: '#f0e3cf' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 admin-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase mb-1" style={{ color: GOLD }}>Live updates</div>
                    <h3 className="text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Recent guest activity</h3>
                  </div>
                  <button onClick={() => setActiveSection('analytics')} className="text-xs" style={{ color: GOLD }}>View analytics →</button>
                </div>
                <div className="space-y-1">
                  {recentActivity.map((activity) => (
                    <div key={activity.title} className="flex items-center gap-3 py-3 admin-activity-row">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: '#f1eadf', color: '#8a6739' }}>
                        {activity.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm truncate" style={{ color: '#f0e3cf' }}>{activity.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#998873' }}>{activity.detail}</div>
                      </div>
                      <span className="text-xs" style={{ color: '#aa9b89' }}>{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 admin-panel p-6 rounded-2xl">
                <div className="text-xs tracking-[0.18em] uppercase mb-1" style={{ color: GOLD }}>Planning</div>
                <h3 className="text-lg mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Your next priorities</h3>
                <div className="space-y-3">
                  {planningTasks.map((task) => (
                    <div key={task.label} className="flex gap-3 p-3 rounded-xl" style={{ background: task.done ? '#f2f5f0' : '#faf7f2' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ border: `1px solid ${task.done ? SAGE : '#cdbb9f'}`, color: SAGE }}>
                        {task.done ? '✓' : ''}
                      </div>
                      <div>
                        <div className="text-sm" style={{ color: task.done ? '#879084' : '#3d3025', textDecoration: task.done ? 'line-through' : 'none' }}>{task.label}</div>
                        <div className="text-xs mt-1" style={{ color: task.done ? SAGE : '#a17b49' }}>{task.due}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveSection('editor')} className="w-full mt-4 py-2.5 rounded-lg text-xs" style={{ border: '1px solid #dfd3c1', color: '#d9c5a7' }}>
                  Open wedding checklist
                </button>
              </div>
            </div>
          </div>
        );

      case 'guests':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-wrap">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search guests..."
                  className="px-4 py-2 text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #e0d8cc', borderRadius: '8px', color: '#f0e3cf', fontFamily: 'Outfit, sans-serif', width: '220px' }}
                />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="browser-default px-4 py-2 text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #e0d8cc', borderRadius: '8px', color: '#f0e3cf', fontFamily: 'Outfit, sans-serif' }}
                >
                  {['All', 'Family', 'Friend', 'Colleague'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-xs tracking-wide transition-all hover:opacity-80" style={{ background: 'rgba(60, 41, 31, 0.9)', color: '#d9c5a7', borderRadius: '8px', border: '1px solid rgba(204,163,96,0.3)' }}>
                  Import CSV
                </button>
                <button className="btn waves-effect px-4 py-2 text-xs tracking-wide transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`, color: '#fff', borderRadius: '8px' }}>
                  + Add Guest
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
              <div className="overflow-x-auto">
                <table className="highlight w-full text-sm">
                  <thead>
                    <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e0d8cc' }}>
                      {['Guest Name', 'Phone', 'Category', 'RSVP Status', 'Check-in', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: '#ad9a80', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest, i) => (
                      <tr key={i} className="transition-colors hover:bg-amber-50/30" style={{ borderBottom: '1px solid #f5f0ea' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: '#f0e3cf' }}>{guest.name}</td>
                        <td className="px-4 py-3" style={{ color: '#ad9a80' }}>{guest.phone}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(184,150,90,0.14)', color: '#d9c5a7' }}>{guest.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs" style={{
                            background: guest.status === 'Confirmed' ? 'rgba(122,158,126,0.15)' : guest.status === 'Declined' ? 'rgba(200,100,100,0.1)' : 'rgba(184,150,90,0.1)',
                            color: guest.status === 'Confirmed' ? SAGE : guest.status === 'Declined' ? '#c05050' : GOLD,
                          }}>{guest.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: guest.checkin === 'Checked In' ? SAGE : '#ad9a80' }}>
                            {guest.checkin === 'Checked In' ? '✓ ' : '○ '}{guest.checkin}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="text-xs px-2 py-1 rounded transition-all hover:opacity-80" style={{ color: GOLD, border: `1px solid ${GOLD}` }}>Link</button>
                            <button className="text-xs px-2 py-1 rounded transition-all hover:opacity-80" style={{ color: '#d9c5a7', border: '1px solid #e0d8cc' }}>Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'rsvp':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Confirmed', count: 350, color: SAGE, guests: guests.filter(g => g.status === 'Confirmed') },
                { label: 'Pending', count: 100, color: GOLD, guests: guests.filter(g => g.status === 'Pending') },
                { label: 'Declined', count: 50, color: '#c05050', guests: guests.filter(g => g.status === 'Declined') },
              ].map(group => (
                <div key={group.label} className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>{group.label}</h3>
                    <span className="text-2xl font-bold" style={{ color: group.color, fontFamily: 'Playfair Display, serif' }}>{group.count}</span>
                  </div>
                  <div className="space-y-2">
                    {group.guests.slice(0, 3).map((g, i) => (
                      <div key={i} className="text-xs flex justify-between py-1" style={{ borderBottom: '1px solid #f5f0ea', color: '#d9c5a7' }}>
                        <span>{g.name}</span>
                        <span style={{ color: '#ad9a80' }}>{g.category}</span>
                      </div>
                    ))}
                  </div>
                  {group.label === 'Pending' && (
                    <button className="btn waves-effect w-full mt-4 py-2 text-xs tracking-wide transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`, color: '#fff', borderRadius: '6px' }}>
                      Send Reminder
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'invitations':
        return (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
              <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Generate Personalized Link</h3>
              <div className="flex gap-3">
                <input
                  placeholder="Enter guest name"
                  className="flex-1 px-4 py-3 text-sm outline-none"
                  style={{ background: '#faf8f5', border: '1px solid #e0d8cc', borderRadius: '8px', color: '#f0e3cf', fontFamily: 'Outfit, sans-serif' }}
                />
                <button className="btn waves-effect px-6 py-3 text-sm tracking-wide transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`, color: '#fff', borderRadius: '8px' }}>
                  Generate
                </button>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
              <table className="highlight w-full text-sm">
                <thead>
                  <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e0d8cc' }}>
                    {['Guest Name', 'Invitation Link', 'QR Code', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs tracking-widest uppercase" style={{ color: '#ad9a80', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guests.slice(0, 5).map((guest, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f0ea' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#f0e3cf' }}>{guest.name}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: GOLD }}>
                        wedding.com/invite?guest={guest.name.split(' ')[0].toLowerCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-8 h-8 rounded grid grid-cols-3 gap-px p-1" style={{ background: '#f0ebe3' }}>
                          {[...Array(9)].map((_, j) => (
                            <div key={j} className="rounded-sm" style={{ background: j % 3 === 0 || j === 4 ? '#2c2118' : '#f0ebe3' }} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(122,158,126,0.15)', color: SAGE }}>Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'checkin':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard label="Total Guests" value="500" icon="◆" />
              <StatCard label="Checked In" value="300" change="60%" icon="◉" />
              <StatCard label="Remaining" value="200" icon="◇" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl text-center" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                <h3 className="text-lg mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>QR Scanner</h3>
                <div className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f0ebe3', border: '2px dashed #b8965a' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2" style={{ color: GOLD }}>◎</div>
                    <div className="text-xs" style={{ color: '#ad9a80' }}>Point camera at QR</div>
                  </div>
                </div>
                <button className="btn waves-effect px-8 py-3 text-sm tracking-wide transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`, color: '#fff', borderRadius: '8px' }}>
                  Start Scanning
                </button>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Recent Check-ins</h3>
                <div className="space-y-3">
                  {guests.filter(g => g.checkin === 'Checked In').map((g, i) => (
                    <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f5f0ea' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#f0e3cf' }}>{g.name}</div>
                        <div className="text-xs" style={{ color: '#ad9a80' }}>{g.category}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(122,158,126,0.15)', color: SAGE }}>✓ Arrived</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Invitation Views</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={visitorData}>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#ad9a80' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#ad9a80' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="visits" stroke={GOLD} fill="url(#grad2)" name="Views" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>RSVP Conversion</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { label: 'Opened', value: 420 },
                    { label: 'RSVP\'d', value: 350 },
                    { label: 'Confirmed', value: 300 },
                    { label: 'Checked In', value: 250 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#ad9a80' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#ad9a80' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} name="Guests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Most Visited Section', value: 'Gallery', sub: '68% of visitors' },
                { label: 'Avg. Time on Page', value: '4m 32s', sub: 'Engaged visitors' },
                { label: 'Mobile vs Desktop', value: '72% / 28%', sub: 'Mobile-dominant' },
              ].map(item => (
                <div key={item.label} className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                  <div className="text-xs tracking-widest uppercase mb-2" style={{ color: '#ad9a80' }}>{item.label}</div>
                  <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>{item.value}</div>
                  <div className="text-xs" style={{ color: GOLD }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'editor':
        return (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-2">
              {['Couple Info', 'Wedding Details', 'Love Story', 'Gallery', 'Gift Info', 'Music'].map(item => (
                <div key={item} className="p-4 rounded-xl cursor-pointer transition-all hover:border-amber-400" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                  <div className="text-sm font-medium" style={{ color: '#f0e3cf' }}>{item}</div>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
              <h3 className="text-lg mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Couple Information</h3>
              <div className="space-y-4">
                {[
                  { label: 'Bride Name', value: 'Ayu Syafni Zuriyanti' },
                  { label: 'Groom Name', value: 'Kahijina Minda Angga Kusuma' },
                  { label: 'Wedding Date', value: '2028-11-16' },
                  { label: 'Venue', value: 'The Premier Hotel Pekanbaru' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs tracking-widest uppercase mb-1" style={{ color: '#ad9a80' }}>{field.label}</label>
                    <input defaultValue={field.value} className="w-full px-4 py-2 text-sm outline-none" style={{ background: '#faf8f5', border: '1px solid #e0d8cc', borderRadius: '8px', color: '#f0e3cf', fontFamily: 'Outfit, sans-serif' }} />
                  </div>
                ))}
                <button className="btn waves-effect px-6 py-3 text-sm tracking-wide transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`, color: '#fff', borderRadius: '8px' }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Choose Theme</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {themes.map((theme, i) => (
                  <div
                    key={theme.name}
                    onClick={() => setSelectedTheme(i)}
                    className="p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1"
                    style={{
                      background: '#fff',
                      border: selectedTheme === i ? `2px solid ${GOLD}` : '2px solid #e0d8cc',
                    }}
                  >
                    <div className="flex gap-1 mb-3">
                      {theme.colors.map((c, j) => (
                        <div key={j} className="flex-1 h-8 rounded" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="text-xs font-medium" style={{ color: '#f0e3cf' }}>{theme.name}</div>
                    {selectedTheme === i && <div className="text-xs mt-1" style={{ color: GOLD }}>✓ Active</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                <h3 className="text-base mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Typography</h3>
                <div className="space-y-3">
                  {['Playfair Display', 'Cormorant', 'EB Garamond'].map(font => (
                    <label key={font} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="font" defaultChecked={font === 'Playfair Display'} className="browser-default"/>
                      <span className="text-sm" style={{ color: '#f0e3cf', fontFamily: font + ', serif' }}>{font}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
                <h3 className="text-base mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Layout</h3>
                <div className="space-y-3">
                  {['Scroll (Single Page)', 'Multi-Page', 'Magazine'].map(layout => (
                    <label key={layout} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="layout" defaultChecked={layout === 'Scroll (Single Page)'} className="browser-default"/>
                      <span className="text-sm" style={{ color: '#f0e3cf' }}>{layout}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'music':
        return (
          <div className="max-w-xl space-y-4">
            <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e0d8cc' }}>
              <h3 className="text-lg mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>Background Music</h3>
              <div className="space-y-3 mb-6">
                {['Perfect — Ed Sheeran', 'A Thousand Years — Christina Perri', 'Can\'t Help Falling in Love — Elvis'].map((song, i) => (
                  <div key={song} className="flex justify-between items-center p-3 rounded-xl" style={{ background: i === 0 ? 'rgba(184,150,90,0.1)' : '#faf8f5', border: `1px solid ${i === 0 ? GOLD : '#e0d8cc'}` }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#f0e3cf' }}>{song}</div>
                      <div className="text-xs" style={{ color: '#ad9a80' }}>3:4{i + 2}</div>
                    </div>
                    <button className="text-lg" style={{ color: i === 0 ? GOLD : '#ad9a80' }}>
                      {i === 0 ? '▶' : '○'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: '#d9c5a7' }}>Autoplay</span>
                  <div className="w-10 h-6 rounded-full cursor-pointer relative" style={{ background: GOLD }}>
                    <div className="w-4 h-4 rounded-full absolute top-1 right-1" style={{ background: '#fff' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#ad9a80' }}>Volume</label>
                  <input type="range" min={0} max={100} defaultValue={70} className="w-full" style={{ accentColor: GOLD }} />
                </div>
              </div>
            </div>
            <button className="w-full py-3 text-sm tracking-wide transition-all hover:opacity-80" style={{ background: 'rgba(60, 41, 31, 0.9)', color: '#d9c5a7', borderRadius: '8px', border: '1px solid rgba(204,163,96,0.3)' }}>
              + Upload Song
            </button>
          </div>
        );

      default:
        return <div style={{ color: '#ad9a80' }}>Select a section from the sidebar.</div>;
    }
  };

  return (
    <div className="admin-shell min-h-screen flex" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Sidebar */}
      <aside
        className="admin-sidebar flex-shrink-0 flex flex-col transition-all duration-300"
        style={{
          width: sidebarOpen ? '240px' : '60px',
        }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(184,150,90,0.15)' }}>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#f5ecd8' }}>A & A</div>
              <div className="text-xs" style={{ color: 'rgba(184,150,90,0.6)' }}>Admin</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sm transition-all hover:opacity-80"
            style={{ color: 'rgba(184,150,90,0.6)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: sidebarOpen ? 0 : 'auto', marginRight: sidebarOpen ? 0 : 'auto' }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="admin-sidebar-nav flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-100"
              style={{
                background: activeSection === item.id ? 'rgba(184,150,90,0.15)' : 'transparent',
                color: activeSection === item.id ? GOLD : 'rgba(245,236,216,0.6)',
                border: activeSection === item.id ? '1px solid rgba(184,150,90,0.2)' : '1px solid transparent',
              }}
            >
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-xs tracking-wide truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(184,150,90,0.15)' }}>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:opacity-80"
            style={{ color: 'rgba(245,236,216,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="text-sm">↗</span>
            {sidebarOpen && <span className="text-xs">View Invitation</span>}
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:opacity-80"
            style={{ color: 'rgba(245,236,216,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="text-sm">⎋</span>
            {sidebarOpen && <span className="text-xs">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="admin-topbar flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: '#a88858' }}>Angga & Ayu / Workspace</div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#f0e3cf' }}>
              {navItems.find(n => n.id === activeSection)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs" style={{ color: '#ad9a80' }}>Wedding of Angga & Ayu · 16 November 2028</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:block px-3 py-2 text-xs rounded-lg"
              style={{ border: '1px solid #dfd3c1', color: '#d9c5a7' }}
            >
              View live invitation
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`, color: '#fff' }}>A</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
