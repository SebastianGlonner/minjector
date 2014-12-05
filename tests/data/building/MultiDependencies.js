define(['./Dep1', './Dep2'], function() {

});


// This is not adviseable because in real AMD like module
// definition the id of a module should map to a specific file.
// 1 on 1 relation. However, you can put multiple modules inside one
// file, but really look after correct path here:
// Mod2 => (really should be one of) =>
//  - /building/Mod2
// and never =>
//  - /Mod2
//  - Mod2
//  - ./Mod2
//
// wrong => define('Mod2', ['./Dep3', './Dep4'], function() {
/*correct*/ define('/building/Mod2', ['./Dep3', './Dep4'], function() {

});
