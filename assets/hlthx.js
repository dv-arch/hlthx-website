(function(){
  document.querySelectorAll('[data-qty]').forEach(function(box){
    var input = box.querySelector('input');
    box.querySelector('[data-minus]').addEventListener('click', function(){ input.value = Math.max(1, (+input.value||1) - 1); });
    box.querySelector('[data-plus]').addEventListener('click', function(){ input.value = Math.min(20, (+input.value||1) + 1); });
  });
  document.querySelectorAll('[data-plan]').forEach(function(form){
    var hidden = form.querySelector('input[name="selling_plan"]');
    form.querySelectorAll('input[name="plan_choice"]').forEach(function(r){
      r.addEventListener('change', function(){ if (hidden) hidden.value = r.value === 'once' ? '' : r.value; });
    });
  });

  // sticky buy bar appears after the hero and hides at the buy box
  var sticky = document.querySelector('[data-sticky]'), hero = document.querySelector('.hero'), shop = document.getElementById('shop');
  if (sticky && hero && shop && 'IntersectionObserver' in window) {
    var heroOut = false, shopIn = false;
    var upd = function(){ sticky.classList.toggle('on', heroOut && !shopIn); };
    new IntersectionObserver(function(e){ heroOut = !e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function(e){ shopIn = e[0].isIntersecting; upd(); }).observe(shop);
  }
})();
