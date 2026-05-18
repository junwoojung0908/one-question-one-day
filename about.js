(function () {
  const trigger = document.querySelector('.site-title');
  const modal   = document.getElementById('about-modal');
  const close   = document.getElementById('about-close');
  if (!trigger || !modal) return;

  const open  = () => modal.classList.add('modal-open');
  const shut  = () => modal.classList.remove('modal-open');

  trigger.addEventListener('click', e => { e.preventDefault(); open(); });
  close.addEventListener('click', shut);
  modal.addEventListener('click', e => { if (e.target === modal) shut(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });
})();
