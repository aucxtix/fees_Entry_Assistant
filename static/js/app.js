/**
 * Fees Entry Assistant - Frontend Logic
 * Phase 5: Safety Features (Confirmation Step, 1-Click Undo, Duplicate Alert, Gap Check, Activity Log).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Chat Elements
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  const messagesContainer = document.getElementById('messages-container');
  const typingIndicator = document.getElementById('typing-indicator');
  const btnClearChat = document.getElementById('btn-clear-chat');

  // Live Mock Table Elements
  const liveTableHeader = document.getElementById('live-table-header');
  const liveTableBody = document.getElementById('live-table-body');
  const btnResetTable = document.getElementById('btn-reset-table');

  // Activity Log Elements
  const btnOpenActivityLog = document.getElementById('btn-open-activity-log');
  const btnCloseActivityLog = document.getElementById('btn-close-activity-log');
  const btnCloseActivityLogFooter = document.getElementById('btn-close-activity-log-footer');
  const modalActivityLog = document.getElementById('modal-activity-log');
  const activityLogContainer = document.getElementById('activity-log-container');
  const headerLogCount = document.getElementById('header-log-count');

  // Gemini API Key Modal Elements
  const btnOpenGeminiKey = document.getElementById('btn-open-gemini-key');
  const btnCloseGeminiKey = document.getElementById('btn-close-gemini-key');
  const btnCloseGeminiKeyFooter = document.getElementById('btn-close-gemini-key-footer');
  const modalGeminiKey = document.getElementById('modal-gemini-key');
  const inputGeminiKey = document.getElementById('input-gemini-key');
  const btnSaveGeminiKey = document.getElementById('btn-save-gemini-key');
  const geminiSaveStatus = document.getElementById('gemini-save-status');

  // Add Student Modal Elements
  const btnOpenAddStudent = document.getElementById('btn-open-add-student');
  const btnCloseAddStudent = document.getElementById('btn-close-add-student');
  const btnCloseAddStudentFooter = document.getElementById('btn-close-add-student-footer');
  const modalAddStudent = document.getElementById('modal-add-student');
  const formAddStudent = document.getElementById('form-add-student');
  const inputNewStudentName = document.getElementById('input-new-student-name');
  const inputNewStudentStd = document.getElementById('input-new-student-std');
  const inputNewStudentSchool = document.getElementById('input-new-student-school');
  const inputNewStudentFee = document.getElementById('input-new-student-fee');
  const addStudentStatus = document.getElementById('add-student-status');
  const btnSaveNewStudent = document.getElementById('btn-save-new-student');

  let lastUpdatedCell = null;
  let lastNewCol = null;
  let cachedTableData = null;
  const tableSearchInput = document.getElementById('table-search-input');
  const tableStudentCount = document.getElementById('table-student-count');

  if (window.lucide) {
    lucide.createIcons();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  function formatMarkdown(text) {
    if (!text) return '';
    // Security Hardening: Escape HTML first to prevent Stored & Reflected XSS (CWE-79)
    const safe = escapeHtml(text);
    return safe
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n• /g, '<br>• ')
      .replace(/\n/g, '<br>');
  }

  function getColLetter(idx) {
    let letter = "";
    idx += 1;
    while (idx > 0) {
      let rem = (idx - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      idx = Math.floor((idx - 1) / 26);
    }
    return letter;
  }

  // ==============================================================
  // LIVE ON-SCREEN GOOGLE SHEET TABLE RENDERING
  // ==============================================================

  async function renderLiveMockTable(data = null) {
    try {
      if (!data && !cachedTableData) {
        const res = await fetch('/api/mock-table');
        data = await res.json();
      } else if (!data) {
        data = cachedTableData;
      }
      cachedTableData = data;

      const months = data.months || [];
      const students = data.students || [];

      // Update student count badge
      if (tableStudentCount) {
        const totalBase = (data.total_base_fees || 0).toLocaleString();
        tableStudentCount.textContent = `${students.length} Students • ₹${totalBase}`;
      }

      let headerHtml = `
        <th class="p-2.5 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 min-w-[120px]">
          <div class="text-[9px] text-slate-400 font-mono">Col A</div>
          <div>Student Name</div>
        </th>
        <th class="p-2.5 border-r border-slate-200 bg-slate-100 min-w-[60px] text-center">
          <div class="text-[9px] text-slate-400 font-mono">Col B</div>
          <div>Std</div>
        </th>
        <th class="p-2.5 border-r border-slate-200 bg-slate-100 min-w-[100px]">
          <div class="text-[9px] text-slate-400 font-mono">Col C</div>
          <div>School</div>
        </th>
        <th class="p-2.5 border-r border-slate-200 bg-slate-100 text-right min-w-[85px]">
          <div class="text-[9px] text-slate-400 font-mono">Col D</div>
          <div>Base Fee</div>
        </th>
      `;

      months.forEach((m, idx) => {
        const colLetter = getColLetter(4 + idx); // Index 4 = Col E
        const isNewCol = (lastNewCol === m);
        headerHtml += `
          <th class="p-2.5 text-center border-r border-slate-200 min-w-[105px] group ${isNewCol ? 'bg-amber-100 col-new text-amber-900' : 'bg-slate-50'}">
            <div class="flex items-center justify-between text-[9px] text-indigo-500 font-mono font-bold mb-0.5">
              <span>Col ${colLetter}</span>
              <button 
                type="button" 
                data-month="${escapeHtml(m)}"
                class="btn-delete-col text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition active:scale-95 cursor-pointer" 
                title="Delete column '${escapeHtml(m)}'"
                aria-label="Delete column ${escapeHtml(m)}"
              >
                <i data-lucide="trash-2" class="w-3 h-3"></i>
              </button>
            </div>
            <div class="font-mono text-slate-800 font-bold">${escapeHtml(m)}</div>
          </th>
        `;
      });
      liveTableHeader.innerHTML = headerHtml;

      const query = (tableSearchInput ? tableSearchInput.value : "").trim().toLowerCase();
      const filteredStudents = query 
        ? students.filter(s => 
            (s.name && s.name.toLowerCase().includes(query)) ||
            (s.school && s.school.toLowerCase().includes(query)) ||
            (s.std && String(s.std).toLowerCase().includes(query))
          )
        : students;

      if (tableStudentCount && query) {
        tableStudentCount.textContent = `Showing ${filteredStudents.length} of ${students.length}`;
      }

      liveTableBody.innerHTML = filteredStudents.map(s => {
        const payments = s.payments || {};
        let rowHtml = `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="p-2.5 font-semibold text-slate-900 sticky left-0 bg-white border-r border-slate-200 shadow-xs font-sans">${escapeHtml(s.name)}</td>
            <td class="p-2.5 text-center text-slate-600 border-r border-slate-200 font-sans text-xs">${escapeHtml(s.std || '—')}</td>
            <td class="p-2.5 text-slate-600 border-r border-slate-200 font-sans text-xs">${escapeHtml(s.school || '—')}</td>
            <td class="p-2.5 text-right font-medium text-slate-700 border-r border-slate-200 font-mono text-xs">₹${Number(s.monthly_fee).toLocaleString()}</td>
        `;

        months.forEach(m => {
          const paid = payments[m];
          const isJustUpdated = (lastUpdatedCell && lastUpdatedCell.student_id === s.id && lastUpdatedCell.month === m);
          const cellClass = isJustUpdated ? 'cell-updated' : '';

          if (paid !== undefined && paid !== null && paid !== "") {
            rowHtml += `<td class="p-2 text-center border-r border-slate-100 ${cellClass}">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 shadow-2xs">
                ₹${Number(paid).toLocaleString()}
              </span>
            </td>`;
          } else {
            rowHtml += `<td class="p-2 text-center border-r border-slate-100 text-slate-300 font-sans text-xs">—</td>`;
          }
        });

        rowHtml += `</tr>`;
        return rowHtml;
      }).join('');

      if (window.lucide) {
        lucide.createIcons();
      }

    } catch (e) {
      console.error('Error rendering live mock table:', e);
    }
  }

  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', () => {
      renderLiveMockTable(cachedTableData);
    });
  }

  if (liveTableHeader) {
    liveTableHeader.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-delete-col');
      if (btn) {
        const month = btn.getAttribute('data-month');
        if (month) confirmDeleteColumn(month);
      }
    });
  }

  // Reset Table Handler
  btnResetTable.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/mock-reset', { method: 'POST' });
      const data = await res.json();
      lastUpdatedCell = null;
      lastNewCol = null;
      if (tableSearchInput) tableSearchInput.value = '';
      await renderLiveMockTable(data.table);
      await refreshActivityLog();
      const count = (data.table && data.table.students) ? data.table.students.length : 0;
      appendBotMessage(`🔄 **Database reset** to original seed state (${count} students).`, null, 'info');
    } catch (e) {
      alert('Error resetting table');
    }
  });

  // ==============================================================
  // CHAT INTERFACE & INTERACTIVE BOT MESSAGES
  // ==============================================================

  function appendUserMessage(text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const wrapper = document.createElement('div');
    wrapper.className = 'message-user message-enter flex items-start justify-end space-x-2';
    
    wrapper.innerHTML = `
      <div class="message-user-bubble">
        <div class="flex items-center justify-between space-x-3 mb-1 text-[10px] text-indigo-200">
          <span class="font-semibold uppercase tracking-wider">Admin</span>
          <span>${time}</span>
        </div>
        <p class="text-sm font-medium leading-relaxed">${escapeHtml(text)}</p>
      </div>
      <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
        <i data-lucide="user" class="w-4 h-4"></i>
      </div>
    `;

    messagesContainer.appendChild(wrapper);
    if (window.lucide) lucide.createIcons();
    scrollToBottom();
  }

  function appendBotMessage(replyText, timestamp, status = 'success', extraConfig = {}) {
    const time = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const wrapper = document.createElement('div');
    wrapper.className = 'message-bot message-enter flex items-start space-x-3';

    let bgBadge = 'bg-indigo-600 text-white';
    let iconName = 'bot';

    if (status === 'warning' || status === 'duplicate_warning' || status === 'gap_warning') {
      bgBadge = 'bg-amber-100 text-amber-700';
      iconName = 'alert-triangle';
    } else if (status === 'info' || status === 'confirmation_required') {
      bgBadge = 'bg-indigo-100 text-indigo-700';
      iconName = 'help-circle';
    } else if (status === 'error') {
      bgBadge = 'bg-rose-100 text-rose-700';
      iconName = 'alert-circle';
    }

    let buttonsHtml = '';

    // Render interactive options buttons (e.g. Confirm / Cancel / Gap Choices)
    if (extraConfig.options && extraConfig.options.length > 0 && extraConfig.actionId) {
      buttonsHtml = `
        <div class="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 action-buttons-group">
          ${extraConfig.options.map(opt => {
            const isPrimary = opt.primary || opt.choice === 'confirm' || opt.choice === 'fill_gap' || opt.choice === 'confirm_duplicate';
            const btnClass = isPrimary 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-300';
            return `
              <button 
                onclick="handleActionChoice('${extraConfig.actionId}', '${opt.choice}', this)"
                class="px-3.5 py-1.5 rounded-lg text-xs transition active:scale-95 flex items-center space-x-1 ${btnClass}"
              >
                ${opt.choice === 'confirm' ? '<i data-lucide=\"check\" class=\"w-3.5 h-3.5 mr-0.5\"></i>' : ''}
                ${opt.choice === 'cancel' ? '<i data-lucide=\"x\" class=\"w-3.5 h-3.5 mr-0.5\"></i>' : ''}
                <span>${escapeHtml(opt.label)}</span>
              </button>
            `;
          }).join('')}
        </div>
      `;
    }

    // Render Undo Button
    if (extraConfig.entryId) {
      buttonsHtml = `
        <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <button 
            id="btn-undo-${extraConfig.entryId}"
            onclick="handleUndoPayment('${extraConfig.entryId}', this)"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition active:scale-95 flex items-center space-x-1"
          >
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Undo Entry</span>
          </button>
          <span class="text-[10px] text-slate-400">Clears this specific cell</span>
        </div>
      `;
    }

    wrapper.innerHTML = `
      <div class="w-8 h-8 rounded-full ${bgBadge} flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
        <i data-lucide="${iconName}" class="w-4 h-4"></i>
      </div>
      <div class="message-bot-bubble bot-markdown text-sm">
        <div class="flex items-center justify-between mb-1 text-[10px] text-slate-400">
          <span class="font-semibold text-xs text-indigo-600">Fees Assistant</span>
          <span>${time}</span>
        </div>
        <div>${formatMarkdown(replyText)}</div>
        ${buttonsHtml}
      </div>
    `;

    messagesContainer.appendChild(wrapper);
    if (window.lucide) lucide.createIcons();
    scrollToBottom();
  }

  // ==============================================================
  // HANDLE CONFIRM / CANCEL / GAP ACTION CHOICES
  // ==============================================================

  window.handleActionChoice = async function(actionId, choice, btnElement) {
    // Disable all buttons in this group immediately
    const group = btnElement.closest('.action-buttons-group');
    if (group) {
      group.querySelectorAll('button').forEach(b => {
        b.disabled = true;
        b.classList.add('opacity-40', 'cursor-not-allowed');
      });
    }

    typingIndicator.classList.remove('hidden');
    scrollToBottom();

    try {
      let endpoint = '/api/action/confirm';
      let payload = { action_id: actionId, choice: choice };

      if (choice === 'cancel') {
        endpoint = '/api/action/cancel';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      typingIndicator.classList.add('hidden');

      if (res.ok) {
        if (data.status === 'confirmation_required') {
          // Second step after gap choice
          appendBotMessage(data.reply, data.timestamp, data.status, {
            actionId: data.action_id,
            options: data.options
          });
        } else {
          appendBotMessage(data.reply, data.timestamp, data.status, {
            entryId: data.entry_id
          });
        }

        if (data.table_updated && data.table) {
          lastUpdatedCell = data.updated_cell || null;
          await renderLiveMockTable(data.table);
        }
        await refreshActivityLog();
      } else {
        appendBotMessage(`⚠️ ${data.error || 'Failed to complete action.'}`, null, 'error');
      }
    } catch (err) {
      typingIndicator.classList.add('hidden');
      appendBotMessage('⚠️ Network error connecting to server.', null, 'error');
    }
  };

  // ==============================================================
  // HANDLE UNDO PAYMENT
  // ==============================================================

  window.handleUndoPayment = async function(entryId, btnElement) {
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-slate-400"></i><span class="text-slate-400">Undone ✓</span>`;
      btnElement.className = "px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed flex items-center space-x-1";
    }

    typingIndicator.classList.remove('hidden');
    scrollToBottom();

    try {
      const res = await fetch('/api/action/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId })
      });

      const data = await res.json();
      typingIndicator.classList.add('hidden');

      if (res.ok) {
        appendBotMessage(data.reply, data.timestamp, data.status);
        if (data.table_updated && data.table) {
          lastUpdatedCell = null;
          await renderLiveMockTable(data.table);
        }
        await refreshActivityLog();
      } else {
        appendBotMessage(`⚠️ ${data.error || 'Failed to undo entry.'}`, null, 'error');
      }
    } catch (err) {
      typingIndicator.classList.add('hidden');
      appendBotMessage('⚠️ Network error during undo.', null, 'error');
    }
  };

  // ==============================================================
  // CHAT FORM SUBMIT & PRESERVING MESSAGE ON NETWORK ERROR
  // ==============================================================

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // Preserved text in case of network error!
    const savedMessage = message;

    appendUserMessage(message);
    chatInput.value = '';
    btnSend.disabled = true;

    typingIndicator.classList.remove('hidden');
    scrollToBottom();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: savedMessage })
      });

      const data = await response.json();
      typingIndicator.classList.add('hidden');
      btnSend.disabled = false;

      if (response.ok) {
        // Confirmation proposal / Warning with buttons
        appendBotMessage(data.reply, data.timestamp, data.status, {
          actionId: data.action_id,
          options: data.options,
          entryId: data.entry_id
        });

        if (data.table_updated && data.table) {
          lastUpdatedCell = data.updated_cell || null;
          await renderLiveMockTable(data.table);
          await refreshActivityLog();
        }
      } else {
        appendBotMessage(`⚠️ ${data.error || 'Failed to process message.'}`, null, 'error');
      }
    } catch (err) {
      typingIndicator.classList.add('hidden');
      btnSend.disabled = false;

      // SAFETY FEATURE 6: DO NOT LOSE THE ADMIN'S TYPED MESSAGE!
      chatInput.value = savedMessage;
      appendBotMessage('⚠️ **Connection error:** The server could not be reached. Your message was kept in the input box so you don\'t have to retype it.', null, 'error');
      chatInput.focus();
    }
  });

  // ==============================================================
  // REPORT DOWNLOAD & COLUMN DELETION HANDLERS
  // ==============================================================

  window.triggerReportDownload = function() {
    window.location.href = '/api/export-csv';
  };

  window.confirmDeleteColumn = async function(monthName) {
    if (!monthName) return;
    const ok = confirm(`Are you sure you want to delete column "${monthName}" and all fee entries recorded in it?`);
    if (!ok) return;

    typingIndicator.classList.remove('hidden');
    scrollToBottom();

    try {
      const res = await fetch('/api/columns/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month_name: monthName })
      });

      const data = await res.json();
      typingIndicator.classList.add('hidden');

      if (res.ok && data.status === 'success') {
        appendBotMessage(data.reply, data.timestamp, 'warning');
        if (data.table) {
          lastUpdatedCell = null;
          await renderLiveMockTable(data.table);
        }
        await refreshActivityLog();
      } else {
        appendBotMessage(data.reply || `⚠️ Failed to delete column "${monthName}".`, null, 'error');
      }
    } catch (err) {
      typingIndicator.classList.add('hidden');
      appendBotMessage('⚠️ Network error while attempting to delete column.', null, 'error');
    }
  };

  // Simulated Network Drop Test
  window.simulateNetworkError = function() {
    chatInput.value = "Student Dummy has paid 2000";
    appendBotMessage('⚠️ **[Simulated Test] Connection error:** Server unreachable. Notice that your typed message has been safely preserved in the input box below!', null, 'warning');
    chatInput.focus();
  };

  window.useQuickPrompt = function(promptText) {
    chatInput.value = promptText;
    chatForm.dispatchEvent(new Event('submit'));
  };

  btnClearChat.addEventListener('click', () => {
    if (confirm('Clear the chat history screen?')) {
      const welcome = messagesContainer.firstElementChild;
      messagesContainer.innerHTML = '';
      if (welcome) messagesContainer.appendChild(welcome);
      scrollToBottom();
    }
  });

  // ==============================================================
  // ACTIVITY LOG (SESSION HISTORY)
  // ==============================================================

  async function refreshActivityLog() {
    try {
      const res = await fetch('/api/activity-log');
      const data = await res.json();
      const logs = data.log || [];

      headerLogCount.textContent = logs.length;

      if (logs.length === 0) {
        activityLogContainer.innerHTML = `
          <div class="p-8 text-center text-xs text-slate-400">
            No activity yet in this session.
          </div>
        `;
        return;
      }

      activityLogContainer.innerHTML = logs.map(item => {
        let badgeBg = 'bg-emerald-100 text-emerald-800';
        if (item.status === 'Undone') badgeBg = 'bg-amber-100 text-amber-800';
        if (item.status === 'Cancelled') badgeBg = 'bg-slate-200 text-slate-700';
        if (item.status === 'Reset') badgeBg = 'bg-indigo-100 text-indigo-800';

        return `
          <div class="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-900">${escapeHtml(item.student)}</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded font-semibold ${badgeBg}">${escapeHtml(item.status)}</span>
            </div>
            <div class="text-[11px] text-slate-500 flex items-center space-x-2">
              <span>${escapeHtml(item.school)}</span>
              <span>•</span>
              <span class="font-mono text-slate-700">₹${Number(item.amount).toLocaleString()}</span>
              <span>•</span>
              <span class="font-mono font-medium text-indigo-600">${escapeHtml(item.month)}</span>
            </div>
            <div class="text-[10px] text-slate-400 pt-0.5 flex items-center justify-between">
              <span>${escapeHtml(item.note || '')}</span>
              <span>${escapeHtml(item.time)}</span>
            </div>
          </div>
        `;
      }).join('');

    } catch (e) {
      console.error('Error refreshing activity log:', e);
    }
  }

  if (btnOpenActivityLog) {
    btnOpenActivityLog.addEventListener('click', () => {
      refreshActivityLog();
      if (modalActivityLog) modalActivityLog.classList.remove('hidden');
    });
  }
  if (btnCloseActivityLog) {
    btnCloseActivityLog.addEventListener('click', () => {
      if (modalActivityLog) modalActivityLog.classList.add('hidden');
    });
  }
  if (btnCloseActivityLogFooter) {
    btnCloseActivityLogFooter.addEventListener('click', () => {
      if (modalActivityLog) modalActivityLog.classList.add('hidden');
    });
  }

  // ==============================================================
  // GEMINI API KEY MODAL
  // ==============================================================

  if (btnOpenGeminiKey) {
    btnOpenGeminiKey.addEventListener('click', () => {
      if (geminiSaveStatus) geminiSaveStatus.classList.add('hidden');
      if (inputGeminiKey) inputGeminiKey.value = '';
      if (modalGeminiKey) modalGeminiKey.classList.remove('hidden');
    });
  }

  if (btnCloseGeminiKey) {
    btnCloseGeminiKey.addEventListener('click', () => {
      if (modalGeminiKey) modalGeminiKey.classList.add('hidden');
    });
  }
  if (btnCloseGeminiKeyFooter) {
    btnCloseGeminiKeyFooter.addEventListener('click', () => {
      if (modalGeminiKey) modalGeminiKey.classList.add('hidden');
    });
  }

  if (btnSaveGeminiKey) {
    btnSaveGeminiKey.addEventListener('click', async () => {
      const key = inputGeminiKey ? inputGeminiKey.value.trim() : '';
      if (!key) {
        alert('Please enter a valid API key');
        return;
      }

      try {
        const res = await fetch('/api/gemini-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key })
        });
        const data = await res.json();
        if (res.ok) {
          if (geminiSaveStatus) {
            geminiSaveStatus.className = 'p-2 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-200';
            geminiSaveStatus.textContent = '✓ API Key saved successfully!';
            geminiSaveStatus.classList.remove('hidden');
          }
          if (modalGeminiKey) {
            setTimeout(() => modalGeminiKey.classList.add('hidden'), 1200);
          }
        } else {
          alert(data.error || 'Failed to save API key');
        }
      } catch (e) {
        alert('Network error saving key');
      }
    });
  }

  // ==============================================================
  // ADD NEW STUDENT MODAL LOGIC
  // ==============================================================

  if (btnOpenAddStudent) {
    btnOpenAddStudent.addEventListener('click', () => {
      if (addStudentStatus) addStudentStatus.classList.add('hidden');
      if (inputNewStudentName) inputNewStudentName.value = '';
      if (inputNewStudentStd) inputNewStudentStd.value = '';
      if (inputNewStudentSchool) inputNewStudentSchool.value = '';
      if (inputNewStudentFee) inputNewStudentFee.value = '';
      if (modalAddStudent) modalAddStudent.classList.remove('hidden');
      if (inputNewStudentName) setTimeout(() => inputNewStudentName.focus(), 100);
    });
  }

  if (btnCloseAddStudent) {
    btnCloseAddStudent.addEventListener('click', () => {
      if (modalAddStudent) modalAddStudent.classList.add('hidden');
    });
  }

  if (btnCloseAddStudentFooter) {
    btnCloseAddStudentFooter.addEventListener('click', () => {
      if (modalAddStudent) modalAddStudent.classList.add('hidden');
    });
  }

  if (formAddStudent) {
    formAddStudent.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = inputNewStudentName ? inputNewStudentName.value.trim() : '';
      const std = inputNewStudentStd ? inputNewStudentStd.value.trim() : '';
      const school = inputNewStudentSchool ? inputNewStudentSchool.value.trim() : '';
      const fee = inputNewStudentFee ? Number(inputNewStudentFee.value) : 0;

      if (!name) {
        alert('Please enter student name');
        return;
      }

      if (btnSaveNewStudent) btnSaveNewStudent.disabled = true;

      try {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, std, school, monthly_fee: fee })
        });
        const data = await res.json();
        if (btnSaveNewStudent) btnSaveNewStudent.disabled = false;

        if (res.ok && data.status === 'success') {
          if (addStudentStatus) {
            addStudentStatus.className = 'p-2 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-200';
            addStudentStatus.textContent = '✓ Student added successfully!';
            addStudentStatus.classList.remove('hidden');
          }

          setTimeout(() => {
            if (modalAddStudent) modalAddStudent.classList.add('hidden');
          }, 800);

          if (data.table) {
            await renderLiveMockTable(data.table);
          }
          await refreshActivityLog();
          appendBotMessage(data.reply, data.timestamp, 'success');
        } else {
          if (addStudentStatus) {
            addStudentStatus.className = 'p-2 rounded text-xs bg-rose-50 text-rose-800 border border-rose-200';
            addStudentStatus.textContent = data.reply || 'Failed to add student.';
            addStudentStatus.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (btnSaveNewStudent) btnSaveNewStudent.disabled = false;
        alert('Network error adding student.');
      }
    });
  }

  window.addEventListener('click', (e) => {
    if (modalGeminiKey && e.target === modalGeminiKey) modalGeminiKey.classList.add('hidden');
    if (modalActivityLog && e.target === modalActivityLog) modalActivityLog.classList.add('hidden');
    if (modalAddStudent && e.target === modalAddStudent) modalAddStudent.classList.add('hidden');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalGeminiKey) modalGeminiKey.classList.add('hidden');
      if (modalActivityLog) modalActivityLog.classList.add('hidden');
      if (modalAddStudent) modalAddStudent.classList.add('hidden');
    }
  });

  // Initial load
  renderLiveMockTable();
  refreshActivityLog();
});
