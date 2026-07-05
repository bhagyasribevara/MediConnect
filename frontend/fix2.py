import re

file_path = 'src/pages/dashboards/HospitalAdminDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix imports
content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';\nimport { io } from 'socket.io-client';")

# Fix TS6133 by commenting out unused variables or imports
content = re.sub(r'getAppointmentLoad,?', '', content)
content = re.sub(r'getExpiryRisk,?', '', content)
content = re.sub(r'predictHospitalLoad,?', '', content)
content = re.sub(r'aiHospitalLoad,?', '', content)

content = re.sub(r'const \[isRequestModalOpen, setIsRequestModalOpen\] = useState\(false\);', '', content)
content = re.sub(r'const \[requestForm, setRequestForm\].*?;', '', content)
content = re.sub(r'const \[procurements, setProcurements\].*?;', '', content)
content = re.sub(r'const \[isBedAllocationOpen, setIsBedAllocationOpen\].*?;', '', content)
content = re.sub(r'const \[bedsGrid, setBedsGrid\].*?;', '', content)

# Remove unused functions
content = re.sub(r'const handleAddDoctor =.*?};', '', content, flags=re.DOTALL)
content = re.sub(r'const handleApproveAppointment =.*?};', '', content, flags=re.DOTALL)
content = re.sub(r'const handleAllocateBedSubmit =.*?};', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix DoctorDashboard.tsx
file_path_dr = 'src/pages/dashboards/DoctorDashboard.tsx'
with open(file_path_dr, 'r', encoding='utf-8') as f:
    content_dr = f.read()

content_dr = re.sub(r'predictDisease,?', '', content_dr)

with open(file_path_dr, 'w', encoding='utf-8') as f:
    f.write(content_dr)

# Fix SuperAdminDashboard.tsx
file_path_sa = 'src/pages/dashboards/SuperAdminDashboard.tsx'
with open(file_path_sa, 'r', encoding='utf-8') as f:
    content_sa = f.read()

content_sa = re.sub(r'BarChart, Bar, ', '', content_sa)
content_sa = re.sub(r'refetchModels,?', '', content_sa)
content_sa = re.sub(r'const toggleModel =.*?};', '', content_sa, flags=re.DOTALL)

with open(file_path_sa, 'w', encoding='utf-8') as f:
    f.write(content_sa)
