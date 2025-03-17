const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const port = 3000

const allocateRequested = (investors) => {
  return investors.map(investor => {
    const { name, requestedAmount: amount } = investor
    return { name, amount }
  })
}

const aggregateField = (investors, field) => {
  return investors.map(investor => investor[field]).reduce((sum, amount) => sum + amount)
}

const prorateRequested = (allocation, investors) => {
  const weight = aggregateField(investors, 'averageAmount')

  investors.forEach(investor => {
    const { requestedAmount } = investor
    const proratedAmount = allocation * (investor.averageAmount / weight)

    if(proratedAmount > requestedAmount) {
      investor.amount = requestedAmount
    } else {
      investor.amount = proratedAmount
    }
  })

  const totalAllocated = aggregateField(investors, 'amount')

  if(totalAllocated < allocation) {
    const pendingInvestors = investors.filter(investor => investor.amount < investor.requestedAmount)
    const pendingAllocation = allocation - totalAllocated
    const pendingWeight = aggregateField(pendingInvestors, 'averageAmount')

    pendingInvestors.forEach(investor => {
      const proratedRemainingAmount = pendingAllocation * (investor.averageAmount / pendingWeight)
      investor.amount  += proratedRemainingAmount
    })
  }

  return investors
}

const computeAllocations = (allocation, investors) => {
  const totalAllocation = aggregateField(investors, 'requestedAmount')

  if(allocation > totalAllocation) {
    return allocateRequested(investors)
  } else {
    return prorateRequested(allocation, investors)
  }
}

app.use(bodyParser.json())
app.use(cors())

const jsonParser = bodyParser.json()

app.post('/', jsonParser, (req, res) => {
  const { allocation, investors } = req.body
  const allocations = computeAllocations(allocation, investors)
  res.json({ allocations })
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
