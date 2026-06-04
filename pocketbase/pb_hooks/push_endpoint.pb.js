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

routerAdd('POST', '/api/push/schedule', (c) => {
  try {
    // Require authentication
    if (!c.auth.isValid) return c.json(401, { error: 'Unauthorized' })
    
    var data = c.body.json()
    var userId = data.userId
    var title = data.title || ''
    var body = data.body || ''
    var url = data.url || ''
    
    if (!userId || !title || !body) {
      return c.json(400, { error: 'userId, title, and body are required' })
    }
    
    // Validate userId is a string
    if (typeof userId !== 'string') {
      return c.json(400, { error: 'userId must be a string' })
    }
    
    // Check if user exists
    try {
      var user = c.app.findRecordById('users', userId)
      if (!user) return c.json(404, { error: 'User not found' })
    } catch (_) {
      return c.json(404, { error: 'User not found' })
    }
    
    // Create pending notification record
    var notification = {
      user: userId,
      title: title,
      body: body,
      url: url
    }
    
    var record = c.app.collection('pending_notifications').create(notification)
    
    return c.json(200, { success: true, id: record.id })
  } catch (e) {
    return c.json(500, { error: String(e) })
  }
})

routerAdd('GET', '/api/push/pending', (c) => {
  try {
    // Require authentication for this endpoint too
    if (!c.auth.isValid) return c.json(401, { error: 'Unauthorized' })
    
    var records = c.app.findRecordsByFilter('pending_notifications', '', '', 0, 100)
    var notifications = []
    
    for (var i = 0; i < records.length; i++) {
      var rec = records[i]
      notifications.push({
        id: rec.id,
        user: rec.getString('user'),
        title: rec.getString('title'),
        body: rec.getString('body'),
        url: rec.getString('url') || ''
      })
    }
    
    return c.json(200, { notifications: notifications })
  } catch (e) {
    return c.json(500, { error: String(e) })
  }
})

routerAdd('POST', '/api/push/pending/delete', (c) => {
  try {
    // Require authentication
    if (!c.auth.isValid) return c.json(401, { error: 'Unauthorized' })
    
    var data = c.body.json()
    var ids = data.ids
    
    if (!ids || !Array.isArray(ids)) {
      return c.json(400, { error: 'ids array is required' })
    }
    
    for (var i = 0; i < ids.length; i++) {
      try {
        var id = ids[i]
        var record = c.app.findRecordById('pending_notifications', id)
        if (record) c.app.delete(record)
      } catch (_) {
        // Record might already be deleted, continue
      }
    }
    
    return c.json(200, { deleted: ids.length })
  } catch (e) {
    return c.json(500, { error: String(e) })
  }
})
