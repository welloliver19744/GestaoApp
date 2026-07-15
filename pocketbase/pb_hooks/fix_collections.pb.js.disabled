// Debug version - test various APIs
cronAdd("fix-collections", "*/1 * * * *", () => {
  try {
    var all = $app.findAllCollections()
    console.log("[fix] All collections:")
    for (var i = 0; i < all.length; i++) {
      console.log("[fix]   " + all[i].name + " -> id=" + all[i].id + " type=" + all[i].type)
    }
  } catch (e) {
    console.log("[fix] Error: " + String(e))
  }
})
