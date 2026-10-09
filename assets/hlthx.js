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
})();
