const Algebra = require('./ganja.js/ganja.js');
Algebra(4,1,()=>{
  var basis = this.describe().basis;
  var table = [];
  for (var i = 0; i < basis.length; i++) {
    var a = new this(); // zero multivector
    a[i] = 1; // set i-th basis element to 1
    var d = !a; // take the dual
    var j = d.findIndex((x) => x !== 0); // index of dual basis
    table.push(`bs.setDual(bs.${basis[i]}, bs.${basis[j]}, ${d[j]});`)
  }
  console.log(table.join('\n'));
});
