(() => {
  const form = document.getElementById('matchForm');
  const result = document.getElementById('matchResult');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalPrimary = document.getElementById('modalPrimary');
  const fileInput = document.getElementById('healthFile');
  function openModal(title, html, action) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modalPrimary.innerHTML = (action || '我知道了') + ' <span>✓</span>';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.getElementById('privacyInfo').addEventListener('click', event => {
    event.preventDefault();
    openModal('信息说明', '<p>填写内容仅在当前浏览器用于匹配流程演示，不保存或上传。选择健康资料后，只显示文件名，不读取文件内容。</p><p>当前页面没有接入真实 AI 分析、医学评估或购买服务。</p>');
    modalPrimary.dataset.action = 'close';
  });
  function showResult(blocked, title, message, lines) {
    result.hidden = false;
    result.classList.toggle('blocked', blocked);
    result.replaceChildren();
    const heading = document.createElement('h4'); heading.textContent = title;
    const paragraph = document.createElement('p'); paragraph.textContent = message;
    result.append(heading, paragraph);
    if (lines && lines.length) {
      const list = document.createElement('ul');
      lines.forEach(line => { const li = document.createElement('li'); li.textContent = line; list.append(li); });
      result.append(list);
    }
    result.scrollIntoView({behavior:'smooth', block:'nearest'});
  }
  function selectedInterests() {
    const labels = {everyday:'日常营养方向', hydration:'活动与饮水方向', balance:'现有补剂重复核对'};
    return [...form.querySelectorAll('input[name="interest"]:checked')].map(input => labels[input.value]);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const age = document.getElementById('ageGroup').value;
    const lifeStage = document.getElementById('lifeStage').value;
    const conditions = document.getElementById('conditions').value;
    const medications = document.getElementById('medications').value;
    const interests = selectedInterests();
    if (!interests.length) {
      showResult(true, '还需要一个关注方向', '选择至少一个想了解的日常方向，再继续查看下一步。');
      form.querySelector('input[name="interest"]').focus();
      return;
    }
    if (age === 'minor') {
      showResult(true, '暂不适合自动推荐', '首期服务面向成年人，不为未成年人提供自动推荐。请由监护人与专业人士共同判断。');
      return;
    }
    if (lifeStage === 'pregnant' || lifeStage === 'medical') {
      showResult(true, '需要专业人士评估', '孕哺期或需要特殊医学营养管理的情况，暂不进入自动匹配。建议先咨询医生或专业营养人员。');
      return;
    }
    if (conditions === 'yes' || medications === 'yes') {
      showResult(true, '建议先核对健康情况', '涉及疾病、长期健康状况或正在用药时，应由医生判断补充剂是否适用。本原型不会据此生成自动购买方案。');
      return;
    }
    const supplementText = document.getElementById('supplements').value.trim();
    const allergyText = document.getElementById('allergies').value.trim();
    const lines = ['匹配方向：' + interests.join('、'), '状态：待专业审核；尚未形成可购买配方',
      supplementText ? '现有补剂：需在审核时核对重复成分' : '现有补剂：未填写，审核前可补充产品名称'];
    if (allergyText) lines.push('过敏或不耐受信息：需审核适用性');
    showResult(false, '已整理匹配方向，等待专业审核', '这不是 AI 诊断或营养缺乏判断。后续应从已验证的标准配方库中核对适用性、成分重复和单份含量。审核完成前不会开放直接下单。', lines);
  });
  fileInput.addEventListener('change', () => {
    const old = document.querySelector('.health-file-status');
    if (old) old.remove();
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const status = document.createElement('small'); status.className = 'health-file-status';
    if (file.size > 10 * 1024 * 1024) {
      status.textContent = '文件超过 10 MB，请选择较小的文件。';
      fileInput.value = '';
    } else {
      status.textContent = '已选择 ' + file.name + '。本原型不会读取或上传文件内容。';
    }
    fileInput.closest('.optional-upload').after(status);
  });
  document.querySelectorAll('[data-formula]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.formula;
    openModal(name, '<p>这是<strong>标准配方方向</strong>的概念说明。具体成分形式、单份含量和适用限制，需在研发验证及专业审核完成后确认。</p><p>购买前应展示配方编号与版本、每份含量、匹配依据、使用方法、适用限制和审核状态。当前页面不代表已上市配方。</p><p>你可以先在下方填写饮食习惯与现有补剂，由适用性流程判断下一步。</p>', '去了解我的情况');
    modalPrimary.dataset.action = 'match';
  }));
  document.querySelectorAll('[data-order]').forEach(button => button.addEventListener('click', () => {
    const item = button.dataset.order;
    const price = item.includes('首购') ? '¥299（概念示意价）' : '¥249 / 28 枚（概念示意价）';
    openModal('购买前请确认', '<p><strong>' + item + '</strong> · ' + price + '</p><p>正式购买前需确认已审核配方的编号、版本、单份含量、使用说明、批次信息、配送费用和适用限制。若配方发生变化，须重新展示差异并由你确认。</p><p>目前页面为概念原型，不处理订单或支付。订阅应由用户主动选择，并提供暂停和取消入口；本产品不默认自动续费。</p>', '我了解了');
    modalPrimary.dataset.action = 'close';
  }));
  modalPrimary.addEventListener('click', () => {
    if (modalPrimary.dataset.action === 'match') {
      closeModal();
      document.getElementById('match').scrollIntoView({behavior:'smooth'});
      return;
    }
    closeModal();
    modalPrimary.dataset.action = 'close';
  });
  modal.addEventListener('click', event => { if (event.target.dataset.close === 'true') closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  const menuToggle = document.getElementById('menuToggle');
  menuToggle.addEventListener('click', () => {
    const nav = document.querySelector('.desktop-nav');
    const isOpen = nav.classList.toggle('open');
    menuToggle.textContent = isOpen ? '×' : '☰';
    menuToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
  });
  document.querySelectorAll('.desktop-nav a').forEach(link => link.addEventListener('click', () => {
    document.querySelector('.desktop-nav').classList.remove('open');
    menuToggle.textContent = '☰';
  }));
  const productHeroImage = document.getElementById('productHeroImage');
  const productImageCaption = document.getElementById('productImageCaption');
  document.querySelectorAll('.product-thumb').forEach(button => button.addEventListener('click', () => {
    productHeroImage.src = button.dataset.image;
    productHeroImage.alt = button.dataset.alt;
    productImageCaption.textContent = button.dataset.caption;
    document.querySelectorAll('.product-thumb').forEach(thumb => {
      const active = thumb === button;
      thumb.classList.toggle('active', active);
      thumb.setAttribute('aria-pressed', String(active));
    });
  }));
})();
