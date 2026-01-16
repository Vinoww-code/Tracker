 const monthNames=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const monthSelect=document.getElementById('monthSelect');
    const yearSelect=document.getElementById('yearSelect');
    const tableHead=document.getElementById('tableHead');
    const tableBody=document.getElementById('tableBody');
    const summary=document.getElementById('summary');

    let activities=[];

    // Init Selectors
    const now = new Date();
    monthNames.forEach((m,i)=>{
        const o=document.createElement('option');
        o.value=i; o.textContent=m;
        monthSelect.appendChild(o);
    });
    monthSelect.value=now.getMonth();

    for(let y=2024; y<=2030; y++){
        const o=document.createElement('option');
        o.value=y; o.textContent=y;
        yearSelect.appendChild(o);
    }
    yearSelect.value=now.getFullYear();

    monthSelect.onchange=loadData;
    yearSelect.onchange=loadData;
    document.getElementById('addBtn').onclick=addActivity;

    function getDaysInMonth(month, year) {
        return new Date(year, parseInt(month) + 1, 0).getDate();
    }

    function storageKey(){
        return `tracker-${yearSelect.value}-${monthSelect.value}`;
    }

    function saveData(){
        localStorage.setItem(storageKey(), JSON.stringify({activities}));
    }

    function loadData(){
        const saved=localStorage.getItem(storageKey());
        activities=saved ? JSON.parse(saved).activities : [];
        render();
    }

    function addActivity(){
        const name=prompt('Nama kegiatan (misal: Workout, Membaca):');
        if(!name) return;
        const days = getDaysInMonth(monthSelect.value, yearSelect.value);
        activities.push({name, checks: Array(days).fill(false)});
        saveData(); render();
    }

    function removeActivity(i){
        if(confirm(`Hapus "${activities[i].name}"?`)){
            activities.splice(i,1);
            saveData(); render();
        }
    }

    function toggleCheck(ai, day){
        activities[ai].checks[day] = !activities[ai].checks[day];
        saveData(); render();
    }

    function evaluate(){
        if(activities.length===0){
            summary.innerHTML='<div class="stat-card">Belum ada data kegiatan.</div>';
            return;
        }

        const daysInMonth = getDaysInMonth(monthSelect.value, yearSelect.value);
        let best='', maxDone=-1;
        let dayStats=Array(daysInMonth).fill(0);

        activities.forEach(a => {
            const done = a.checks.filter(v=>v).length;
            if(done > maxDone){ maxDone=done; best=a.name; }
            a.checks.forEach((v,i) => { if(v) dayStats[i]++; });
        });

        const productive = dayStats.filter(v => v > 0).length;
        const streak = dayStats.filter(v => v === activities.length && activities.length > 0).length;

        summary.innerHTML = `
            <div class="stat-card"><small>Paling Konsisten</small><span>${best || '-'}</span></div>
            <div class="stat-card"><small>Hari Produktif</small><span>${productive} Hari</span></div>
            <div class="stat-card"><small>Target Tercapai</small><span>${streak} Hari</span></div>
        `;
    }

    function render(){
        const days = getDaysInMonth(monthSelect.value, yearSelect.value);
        
        // Render Header
        let headHtml = `<tr><th class="activity-name-cell">Kegiatan</th>`;
        for(let d=1; d<=days; d++) headHtml += `<th>${d}</th>`;
        headHtml += `</tr>`;
        tableHead.innerHTML = headHtml;

        // Render Body
        tableBody.innerHTML = '';
        activities.forEach((a, ai) => {
            const done = a.checks.filter(v=>v).length;
            const percent = Math.round((done/days)*100);
            const color = percent < 30 ? 'var(--danger)' : (percent < 70 ? 'var(--warning)' : 'var(--success)');

            const tr = document.createElement('tr');
            tr.className = 'activity-row';

            // Nama & Progress
            let rowHtml = `
                <td class="activity-name-cell">
                    <div>
                        <strong>${a.name}</strong>
                        <button class="delete-btn" onclick="removeActivity(${ai})">✕</button>
                    </div>
                    <div style="font-size:10px; color:#000000; margin-top:4px">${done}/${days} hari (${percent}%)</div>
                    <div class="mini-progress">
                        <div class="mini-progress-fill" style="width:${percent}%; background:${color}"></div>
                    </div>
                </td>
            `;

            // Checkboxes
            for(let d=0; d<days; d++){
                const checked = a.checks[d] ? 'checked' : '';
                rowHtml += `<td><input type="checkbox" ${checked} onchange="toggleCheck(${ai}, ${d})"></td>`;
            }
            
            tr.innerHTML = rowHtml;
            tableBody.appendChild(tr);
        });

        evaluate();
    }

    loadData();