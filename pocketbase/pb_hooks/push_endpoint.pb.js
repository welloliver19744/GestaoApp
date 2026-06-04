routerAdd('POST', '/api/push/check', (c) => {
  try {
    var subs = c.app.findRecordsByFilter('push_subscriptions', 'enabled=true', '', 0, 200)
    var subscriptions = []
    var userIds = {}
    for (var i = 0; i < subs.length; i++) {
      var subData = subs[i].get('subscription')
      subscriptions.push({
        id: subs[i].id,
        subscription: typeof subData === 'string' ? JSON.parse(subData) : subData,
      })
      var uid = subs[i].getString('user')
      if (uid) userIds[uid] = true
    }

    var users = []
    for (var uid in userIds) {
      try {
        var u = c.app.findRecordById('users', uid)
        if (u) {
          users.push({
            id: u.id,
            email: u.getString('email'),
            name: u.getString('name'),
          })
        }
      } catch (_) {}
    }

    var d = new Date()
    var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

    var tom = new Date()
    tom.setDate(tom.getDate() + 1)
    var tomorrow = tom.getFullYear() + '-' + String(tom.getMonth() + 1).padStart(2, '0') + '-' + String(tom.getDate()).padStart(2, '0')

    var dueTomorrow = c.app.findRecordsByFilter(
      'transactions',
      "due_date >= '" + tomorrow + " 00:00:00.000Z' && due_date < '" + tomorrow + " 23:59:59.999Z' && paid=false",
      '', 0, 1
    ).length

    var overdue = c.app.findRecordsByFilter(
      'transactions',
      "due_date < '" + today + " 00:00:00.000Z' && paid=false",
      '', 0, 1
    ).length

    return c.json(200, { subscriptions: subscriptions, users: users, dueTomorrow: dueTomorrow, overdue: overdue })
  } catch (e) {
    return c.json(200, { subscriptions: [], users: [], dueTomorrow: 0, overdue: 0, error: String(e) })
  }
})

routerAdd('POST', '/api/push/delete-subscription', (c) => {
  try {
    var subId = c.request.header.get('X-Subscription-Id')
    if (!subId) return c.json(400, { error: 'missing X-Subscription-Id header' })
    var sub = c.app.findRecordById('push_subscriptions', subId)
    if (sub) c.app.delete(sub)
    return c.json(200, { deleted: true })
  } catch (e) {
    return c.json(200, { error: String(e) })
  }
})
