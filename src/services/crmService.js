async function syncWithZohoCRM(patient) {
  console.log(`Syncing patient ${patient.name} to Zoho CRM (mock)`)

  // Simulate CRM sync success 80% of time
  const success = Math.random() < 0.8

  await new Promise(res => setTimeout(res, 500))

  if (success) {
    console.log('Zoho CRM sync successful')
  } else {
    console.log('Zoho CRM sync failed')
    throw new Error('Simulated CRM sync failure')
  }
}

module.exports = { syncWithZohoCRM }
