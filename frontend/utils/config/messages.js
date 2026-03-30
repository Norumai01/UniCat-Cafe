/**
 * Cat Cafe Config - Message Template Utilities
 * Handles rendering and updating of chat message templates
 */

//console.log('💬 Messages utility loaded');

/**
 * Renders the success message template inputs for each category
 */
function renderMessageTemplates() {
  const container = document.getElementById('messageTemplates');
  if (!container) return;

  container.innerHTML = '';

  categories.forEach(cat => {
    const message = categoryMessages[cat.id] || '';

    const categorySection = document.createElement('div');
    categorySection.className = 'message-category-section';

    categorySection.innerHTML = `
      <div class="message-category-header">
        <span class="message-category-title">${escapeHtml(cat.label)}</span>
      </div>
      <div class="message-template-item">
        <textarea 
          class="message-template-input"
          rows="2"
          maxlength="300"
          placeholder="e.g., @{username} ordered {item}!"
          data-cat-id="${cat.id}"
        >${escapeHtml(message)}</textarea>
        <div class="message-template-help">
          Use <code>{username}</code> for viewer name and <code>{item}</code> for menu item
        </div>
      </div>
    `;

    container.appendChild(categorySection);

    // Attach event listener to textarea
    const textarea = categorySection.querySelector('.message-template-input');
    textarea.addEventListener('change', function() {
      updateMessageTemplate(cat.id, this.value);
    });
  });
}

/**
 * Renders the fail message template inputs for each category
 */
function renderFailMessageTemplates() {
  const container = document.getElementById('failMessageTemplates');
  if (!container) return;

  container.innerHTML = '';

  categories.forEach(cat => {
    const message = failMessages[cat.id] || '';

    const categorySection = document.createElement('div');
    categorySection.className = 'message-category-section';

    categorySection.innerHTML = `
      <div class="message-category-header">
        <span class="message-category-title">${escapeHtml(cat.label)}</span>
      </div>
      <div class="message-template-item">
        <textarea 
          class="message-template-input fail-message-input"
          rows="2"
          maxlength="300"
          placeholder="e.g., Oh no! @{username} dropped the {item}!"
          data-cat-id="${cat.id}"
        >${escapeHtml(message)}</textarea>
        <div class="message-template-help">
          Use <code>{username}</code> for viewer name and <code>{item}</code> for menu item
        </div>
      </div>
    `;

    container.appendChild(categorySection);

    // Attach event listener to textarea
    const textarea = categorySection.querySelector('.fail-message-input');
    textarea.addEventListener('change', function() {
      updateFailMessageTemplate(cat.id, this.value);
    });
  });
}

/**
 * Updates a success message template for a category
 * @param {string} catId - Category ID
 * @param {string} value - New message template
 */
function updateMessageTemplate(catId, value) {
  const trimmed = value.trim();

  // Validate the template
  const validation = validateMessageTemplate(trimmed);
  if (!validation.isValid) {
    showStatus(validation.error, 'error');
    return;
  }

  categoryMessages[catId] = trimmed;
  //console.log(`Updated ${catId} message:`, trimmed);
}

/**
 * Updates a fail message template for a category
 * @param {string} catId - Category ID
 * @param {string} value - New fail message template
 */
function updateFailMessageTemplate(catId, value) {
  const trimmed = value.trim();

  // Validate the template
  const validation = validateMessageTemplate(trimmed);
  if (!validation.isValid) {
    showStatus(validation.error, 'error');
    return;
  }

  failMessages[catId] = trimmed;
  //console.log(`Updated ${catId} fail message:`, trimmed);
}

/**
 * Resets all message templates back to defaults for the current categories
 */
function resetMessages() {
  const { success: defSuccess, fail: defFail } = buildDefaultMessages(categories);
  categoryMessages = defSuccess;
  failMessages = defFail;

  renderMessageTemplates();
  renderFailMessageTemplates();
  showStatus('✅ Messages reset to defaults! Remember to save your changes.', 'success');
}
