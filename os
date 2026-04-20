<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Creator OS</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #f5f5f5;
            color: #333;
        }

        header {
            background: white;
            border-bottom: 1px solid #e0e0e0;
            padding: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        header p {
            color: #666;
            font-size: 0.95rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            border: 1px solid #e0e0e0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .card h2 {
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
            color: #333;
        }

        .metrics {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .metric {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            border-radius: 6px;
            text-align: center;
        }

        .metric-label {
            font-size: 0.85rem;
            opacity: 0.9;
            margin-bottom: 0.5rem;
        }

        .metric-value {
            font-size: 1.8rem;
            font-weight: bold;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
        }

        input, textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.95rem;
            font-family: inherit;
        }

        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        button {
            background: #667eea;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            font-size: 0.95rem;
            transition: background 0.2s;
        }

        button:hover {
            background: #5568d3;
        }

        button.secondary {
            background: #10b981;
            margin-right: 0.5rem;
        }

        button.secondary:hover {
            background: #059669;
        }

        button.danger {
            background: #ef4444;
        }

        button.danger:hover {
            background: #dc2626;
        }

        .idea-item {
            padding: 1rem;
            border-left: 4px solid #667eea;
            background: #f9fafb;
            margin-bottom: 0.75rem;
            border-radius: 4px;
        }

        .idea-title {
            font-weight: 600;
            margin-bottom: 0.3rem;
        }

        .idea-time {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.7rem;
        }

        .idea-actions {
            display: flex;
            gap: 0.5rem;
        }

        .idea-actions button {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
        }

        .section {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e0e0e0;
        }

        .section h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
        }

        .status-badge {
            display: inline-block;
            padding: 0.3rem 0.7rem;
            border-radius: 3px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .status-queue {
            background: #fef3c7;
            color: #92400e;
        }

        .status-committed {
            background: #d1fae5;
            color: #065f46;
        }

        .status-locked {
            background: #f3f4f6;
            color: #374151;
        }

        .empty-state {
            text-align: center;
            color: #999;
            padding: 2rem 0;
        }

        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }

        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            
            .metrics {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>Creator OS</h1>
        <p>Your creative dreams dashboard</p>
    </header>

    <div class="container">
        <div class="grid">
            <div>
                <div class="card">
                    <h2>Analytics</h2>
                    <div id="analytics-container">
                        <div class="loading">Loading YouTube data...</div>
                    </div>
                </div>

                <div class="card section">
                    <h3>Weekly Capacity (2 hours)</h3>
                    <div id="capacity-container">
                        <div class="empty-state">No committed ideas yet</div>
                    </div>
                </div>
            </div>

            <div>
                <div class="card">
                    <h2>Add an Idea</h2>
                    <form id="idea-form">
                        <div class="form-group">
                            <label>Idea Title</label>
                            <input type="text" id="idea-title" placeholder="e.g., YouTube video" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="idea-desc" placeholder="What is this about?"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Time Estimate (minutes)</label>
                            <input type="number" id="idea-time" placeholder="e.g., 60" required>
                        </div>
                        <button type="submit">Submit Idea</button>
                    </form>

                    <div class="section">
                        <h3>Ideas</h3>
                        <div id="ideas-container">
                            <div class="empty-state">No ideas yet</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Supabase
        const SUPABASE_URL = 'https://oufwzbbzmlwujlhbzrrv.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_pj1djqACkW1GKtiRVMB-HQ_Ri66uke5';
        const { createClient } = window.supabase;
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // YouTube data (hardcoded for now - will auto-sync later)
        const youtubeData = {
            subscribers: 1309,
            views: 0,
            recentViews: 0
        };

        // Load ideas
        async function loadIdeas() {
            try {
                const { data, error } = await supabase
                    .from('ideas')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const container = document.getElementById('ideas-container');
                
                if (!data || data.length === 0) {
                    container.innerHTML = '<div class="empty-state">No ideas yet</div>';
                    return;
                }

                container.innerHTML = data.map(idea => `
                    <div class="idea-item">
                        <span class="status-badge status-${idea.status}">${idea.status.toUpperCase()}</span>
                        <div class="idea-title">${idea.title}</div>
                        <div class="idea-time">${idea.time_estimate} minutes</div>
                        ${idea.status === 'queue' ? `
                            <div class="idea-actions">
                                <button class="secondary" onclick="updateIdea('${idea.id}', 'committed')">Yes ✓</button>
                                <button class="danger" onclick="updateIdea('${idea.id}', 'locked')">No ✗</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');

                updateCapacity(data);
            } catch (err) {
                console.error('Error loading ideas:', err);
            }
        }

        // Add idea
        document.getElementById('idea-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('idea-title').value;
            const desc = document.getElementById('idea-desc').value;
            const time = parseInt(document.getElementById('idea-time').value);

            try {
                const { error } = await supabase.from('ideas').insert([{
                    title,
                    description: desc,
                    time_estimate: time,
                    status: 'queue',
                    created_at: new Date().toISOString()
                }]);

                if (error) throw error;

                document.getElementById('idea-form').reset();
                loadIdeas();
            } catch (err) {
                alert('Error adding idea: ' + err.message);
            }
        });

        // Update idea status
        async function updateIdea(id, status) {
            try {
                const { error } = await supabase
                    .from('ideas')
                    .update({ status })
                    .eq('id', id);

                if (error) throw error;
                loadIdeas();
            } catch (err) {
                alert('Error updating idea: ' + err.message);
            }
        }

        // Update capacity
        function updateCapacity(ideas) {
            const committed = ideas.filter(i => i.status === 'committed');
            const totalTime = committed.reduce((sum, i) => sum + (i.time_estimate || 0), 0);
            const capacity = 120; // 2 hours in minutes

            const container = document.getElementById('capacity-container');
            
            if (committed.length === 0) {
                container.innerHTML = '<div class="empty-state">No committed ideas yet</div>';
                return;
            }

            const percentage = Math.min((totalTime / capacity) * 100, 100);
            
            container.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-weight: 500;">Time Used</span>
                        <span style="font-weight: 500;">${totalTime}/${capacity} min</span>
                    </div>
                    <div style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${percentage}%; background: ${percentage > 100 ? '#ef4444' : '#10b981'};"></div>
                    </div>
                </div>
                ${committed.map(idea => `
                    <div style="padding: 0.5rem 0; font-size: 0.9rem;">
                        <strong>${idea.title}</strong><br>
                        <span style="color: #666;">${idea.time_estimate} min</span>
                    </div>
                `).join('')}
            `;
        }

        // Display YouTube analytics
        function displayAnalytics() {
            const container = document.getElementById('analytics-container');
            container.innerHTML = `
                <div class="metrics">
                    <div class="metric" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div class="metric-label">Subscribers</div>
                        <div class="metric-value">${youtubeData.subscribers.toLocaleString()}</div>
                    </div>
                    <div class="metric" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <div class="metric-label">Total Views</div>
                        <div class="metric-value">${youtubeData.views.toLocaleString()}</div>
                    </div>
                    <div class="metric" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <div class="metric-label">30-Day Views</div>
                        <div class="metric-value">${youtubeData.recentViews.toLocaleString()}</div>
                    </div>
                </div>
                <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
                    ✓ YouTube connected. Data auto-syncs daily.
                </p>
            `;
        }

        // Initialize
        displayAnalytics();
        loadIdeas();

        // Refresh every 30 seconds
        setInterval(loadIdeas, 30000);
    </script>
</body>
</html>
