import sys

file_path = 'src/pages/dashboards/HospitalAdminDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_content = """            {/* Sidebar Footer */}
            <div className="mt-auto pt-6 border-t border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white text-[#14C8B4] font-bold rounded-lg flex items-center justify-center shadow-md">
                  H
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">HospitalAdmin User</p>
                  <p className="text-[10px] text-white/70 font-medium truncate">demo_hospitaladmin</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-[9px] text-white/70">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('role');
                  window.location.href = '/login';
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
"""

lines = lines[:235] + [new_content] + lines[357:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
