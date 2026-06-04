migrate((app) => {
  const seed = [
    { name: 'Alimentação', icon: 'shopping-cart', color: '#f97316' },
    { name: 'Transporte', icon: 'car', color: '#22d3ee' },
    { name: 'Moradia', icon: 'home', color: '#fbbf24' },
    { name: 'Saúde', icon: 'heart', color: '#fb7185' },
    { name: 'Educação', icon: 'book', color: '#c084fc' },
    { name: 'Lazer', icon: 'gamepad', color: '#4ade80' },
    { name: 'Assinaturas', icon: 'repeat', color: '#a78bfa' },
    { name: 'Serviços', icon: 'zap', color: '#f472b6' },
    { name: 'Salário', icon: 'briefcase', color: '#34d399' },
    { name: 'Outros', icon: 'more-horizontal', color: '#9ca3af' },
  ]

  const collection = app.findCollectionByNameOrId('categories')
  if (!collection) return

  for (const cat of seed) {
    const record = new Record(collection, cat)
    app.save(record)
  }
}, (app) => {})
