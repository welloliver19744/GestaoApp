// Gera transações a partir de recorrências
// Roda todo dia às 05:00 (UTC = 02:00 Brasília)
cronAdd("generate-recurring", "0 5 * * *", () => {
  const today = new Date()
  const todayStr = today.toISOString().replace("T", " ")

  // Busca recorrências ativas com next_due <= hoje
  const records = $app.dao().findRecordsByFilter(
    "recurring_transactions",
    "active = true && next_due <= {:today}",
    "-next_due",
    100,
    0,
    { today: todayStr },
  )

  records.forEach(function (record) {
    var description = record.get("description")
    var category = record.get("category")
    var store = record.get("store") || ""
    var totalAmount = record.get("total_amount")
    var paymentType = record.get("payment_type")
    var installmentCount = record.get("installment_count")
    var installmentValue = record.get("installment_value")
    var notes = record.get("notes") || ""
    var frequency = record.get("frequency")

    var nextDue = new Date(record.get("next_due"))
    var dueStr = nextDue.toISOString().slice(0, 10)

    var collection = $app.dao().findCollectionByNameOrId("transactions")

    if (paymentType === "cash") {
      var tx = $app.dao().createRecord(collection, {
        description: description,
        category: category,
        store: store,
        purchase_date: dueStr,
        total_amount: totalAmount,
        payment_type: "cash",
        installment_count: 1,
        installment_number: 1,
        installment_value: totalAmount,
        due_date: dueStr,
        paid: false,
        notes: notes,
      })
      $app.dao().saveRecord(tx)
    } else {
      var groupId = crypto.randomUUID()
      for (var i = 0; i < installmentCount; i++) {
        var due = new Date(nextDue)
        due.setMonth(due.getMonth() + i)
        var tx = $app.dao().createRecord(collection, {
          description: description,
          category: category,
          store: store,
          purchase_date: dueStr,
          total_amount: totalAmount,
          payment_type: "installment",
          installment_count: installmentCount,
          installment_number: i + 1,
          installment_value: installmentValue,
          due_date: due.toISOString().slice(0, 10),
          paid: false,
          group_id: groupId,
          notes: notes,
        })
        $app.dao().saveRecord(tx)
      }
    }

    // Avança a próxima data
    var newNextDue = new Date(nextDue)
    if (frequency === "yearly") {
      newNextDue.setFullYear(newNextDue.getFullYear() + 1)
    } else {
      newNextDue.setMonth(newNextDue.getMonth() + 1)
    }

    record.set("next_due", newNextDue.toISOString().replace("T", " "))
    $app.dao().saveRecord(record)
  })
})
