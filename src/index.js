// Cloudflare Worker with D1 database
// Handles registration API and admin functions

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // API: Register new student
      if (path === '/api/register' && request.method === 'POST') {
        return await handleRegister(request, env, corsHeaders);
      }
      
      // API: Get all registrations (admin)
      if (path === '/api/admin/registrations' && request.method === 'POST') {
        return await handleAdminGet(request, env, corsHeaders);
      }
      
      // API: Delete registration (admin)
      if (path === '/api/admin/delete' && request.method === 'POST') {
        return await handleAdminDelete(request, env, corsHeaders);
      }
      
      // Admin page
      if (path === '/admin' || path === '/admin/') {
        return new Response(adminPageHTML, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      // Static files - serve from bucket or pass through
      return await serveStatic(request, env, corsHeaders);
      
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};

// Hardcoded admin password (should be moved to env var in production)
const ADMIN_PASSWORD = 'smp2026admin';

async function handleRegister(request, env, corsHeaders) {
  const data = await request.json();
  
  const { nama_siswa, nama_ortu, no_hp, email, asal_sekolah, alamat } = data;
  
  if (!nama_siswa || !nama_ortu || !no_hp || !asal_sekolah || !alamat) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const result = await env.DB.prepare(
    `INSERT INTO registrations (nama_siswa, nama_ortu, no_hp, email, asal_sekolah, alamat, timestamp) 
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(nama_siswa, nama_ortu, no_hp, email || null, asal_sekolah, alamat).run();
  
  return new Response(
    JSON.stringify({ success: true, id: result.meta.last_row_id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAdminGet(request, env, corsHeaders) {
  const { password } = await request.json();
  
  if (password !== ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid password' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { results } = await env.DB.prepare(
    'SELECT * FROM registrations ORDER BY timestamp DESC'
  ).all();
  
  return new Response(
    JSON.stringify({ success: true, data: results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAdminDelete(request, env, corsHeaders) {
  const { password, id } = await request.json();
  
  if (password !== ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid password' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  await env.DB.prepare('DELETE FROM registrations WHERE id = ?').bind(id).run();
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function serveStatic(request, env, corsHeaders) {
  // For Cloudflare Pages, static files are served automatically
  // For Worker-only deploy, you'd need to fetch from R2 or KV
  return new Response('Not found', { status: 404, headers: corsHeaders });
}

// Admin page HTML (embedded)
const adminPageHTML = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Data Pendaftaran</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .login-screen { display: flex; }
        .data-screen { display: none; }
        .data-screen.active { display: block; }
        .login-screen.hidden { display: none; }
    </style>
</head>
<body class="font-sans text-slate-800 antialiased bg-slate-50">
    <div id="loginScreen" class="login-screen min-h-screen items-center justify-center">
        <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">A</div>
                <h1 class="text-2xl font-bold text-slate-900">Admin Panel</h1>
                <p class="text-slate-500 mt-2">SMP DR MUSTA'IN ROMLY</p>
            </div>
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <input type="password" id="password" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Masukkan password admin" required>
                </div>
                <p id="errorMsg" class="text-red-500 text-sm hidden">Password salah!</p>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">Login</button>
            </form>
            <div class="mt-6 text-center">
                <a href="/" class="text-slate-500 hover:text-blue-600 text-sm">← Kembali ke Website</a>
            </div>
        </div>
    </div>

    <div id="dataScreen" class="data-screen min-h-screen">
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                        <div>
                            <h1 class="font-semibold text-slate-900">Data Pendaftaran</h1>
                            <p class="text-xs text-slate-500">SMP DR MUSTA'IN ROMLY</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="loadData()" class="text-slate-600 hover:text-blue-600 flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            Refresh
                        </button>
                        <button onclick="logout()" class="text-red-600 hover:text-red-700 text-sm font-medium">Logout</button>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border">
                    <p class="text-sm text-slate-500">Total Pendaftar</p>
                    <p id="totalCount" class="text-3xl font-bold text-blue-600 mt-1">0</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border">
                    <p class="text-sm text-slate-500">Pendaftar Hari Ini</p>
                    <p id="todayCount" class="text-3xl font-bold text-green-600 mt-1">0</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border">
                    <p class="text-sm text-slate-500">Terakhir Update</p>
                    <p id="lastUpdate" class="text-lg font-medium text-slate-700 mt-1">-</p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h2 class="font-semibold text-slate-900">Daftar Pendaftar</h2>
                    <button onclick="exportToCSV()" class="text-sm text-blue-600 hover:underline">Export CSV</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-slate-50 text-slate-600">
                            <tr>
                                <th class="px-4 py-3 font-medium">ID</th>
                                <th class="px-4 py-3 font-medium">Nama Siswa</th>
                                <th class="px-4 py-3 font-medium">Orang Tua</th>
                                <th class="px-4 py-3 font-medium">No. HP</th>
                                <th class="px-4 py-3 font-medium">Email</th>
                                <th class="px-4 py-3 font-medium">Asal Sekolah</th>
                                <th class="px-4 py-3 font-medium">Alamat</th>
                                <th class="px-4 py-3 font-medium">Waktu</th>
                                <th class="px-4 py-3 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody" class="divide-y"></tbody>
                    </table>
                </div>
                <div id="emptyState" class="hidden text-center py-12">
                    <svg class="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <p class="text-slate-500">Belum ada data pendaftaran</p>
                </div>
            </div>
        </main>
    </div>

    <script>
        const API_URL = window.location.origin;
        let currentPassword = '';
        let registrations = [];

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(\`/api/admin/registrations\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentPassword = password;
                    registrations = data.data;
                    showDataScreen();
                    renderTable();
                    updateStats();
                } else {
                    document.getElementById('errorMsg').classList.remove('hidden');
                }
            } catch (error) {
                document.getElementById('errorMsg').textContent = 'Terjadi kesalahan koneksi';
                document.getElementById('errorMsg').classList.remove('hidden');
            }
        });

        function showDataScreen() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('dataScreen').classList.add('active');
        }

        function logout() {
            currentPassword = '';
            registrations = [];
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('dataScreen').classList.remove('active');
            document.getElementById('password').value = '';
            document.getElementById('errorMsg').classList.add('hidden');
        }

        async function loadData() {
            try {
                const response = await fetch(\`/api/admin/registrations\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: currentPassword })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    registrations = data.data;
                    renderTable();
                    updateStats();
                }
            } catch (error) {
                alert('Gagal memuat data');
            }
        }

        function renderTable() {
            const tbody = document.getElementById('tableBody');
            const emptyState = document.getElementById('emptyState');
            
            if (registrations.length === 0) {
                tbody.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }
            
            emptyState.classList.add('hidden');
            
            tbody.innerHTML = registrations.map(r => \`
                <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3">\${r.id}</td>
                    <td class="px-4 py-3 font-medium">\${escapeHtml(r.nama_siswa)}</td>
                    <td class="px-4 py-3">\${escapeHtml(r.nama_ortu)}</td>
                    <td class="px-4 py-3">\${escapeHtml(r.no_hp)}</td>
                    <td class="px-4 py-3">\${r.email ? escapeHtml(r.email) : '-'}</td>
                    <td class="px-4 py-3">\${escapeHtml(r.asal_sekolah)}</td>
                    <td class="px-4 py-3 max-w-xs truncate">\${escapeHtml(r.alamat)}</td>
                    <td class="px-4 py-3 text-slate-500">\${formatDate(r.timestamp)}</td>
                    <td class="px-4 py-3">
                        <button onclick="deleteRow(\${r.id})" class="text-red-600 hover:text-red-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </td>
                </tr>
            \`).join('');
        }

        function updateStats() {
            document.getElementById('totalCount').textContent = registrations.length;
            const today = new Date().toDateString();
            const todayCount = registrations.filter(r => new Date(r.timestamp).toDateString() === today).length;
            document.getElementById('todayCount').textContent = todayCount;
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString('id-ID');
        }

        async function deleteRow(id) {
            if (!confirm('Hapus pendaftar ini?')) return;
            
            try {
                const response = await fetch(\`/api/admin/delete\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: currentPassword, id })
                });
                
                const data = await response.json();
                if (data.success) loadData();
            } catch (error) {
                alert('Gagal menghapus data');
            }
        }

        function exportToCSV() {
            if (registrations.length === 0) { alert('Tidak ada data'); return; }
            
            const headers = ['ID', 'Nama Siswa', 'Nama Ortu', 'No HP', 'Email', 'Asal Sekolah', 'Alamat', 'Timestamp'];
            const rows = registrations.map(r => [r.id, r.nama_siswa, r.nama_ortu, r.no_hp, r.email || '', r.asal_sekolah, r.alamat, r.timestamp]);
            
            let csv = headers.join(',') + '\\n';
            csv += rows.map(row => row.map(cell => \`"\${String(cell).replace(/"/g, '""')}"\`).join(',')).join('\\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`pendaftaran-\${new Date().toISOString().split('T')[0]}.csv\`;
            a.click();
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDate(timestamp) {
            return new Date(timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    </script>
</body>
</html>`;
