import { tokens, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Token', ([deployer, receiver, exchange]) => {
  const name = 'Boost Token'
  const symbol = 'BOOST'
  const decimals = '18'
  const totalSupply = tokens(1000000).toString() // 1 million tokens
  let token

  // Get the Token object from EVM
  beforeEach(async () => {
    token = await Token.new()
  })

  // Deployment of Smart Contract
  // Testing section for basic Token info
  describe('Smart Contract deployment', () => {
    it('tracks the name', async () => {
      const result = await token.name()
      result.should.equal(name)
    })

    it('tracks the symbol', async ()  => {
      const result = await token.symbol()
      result.should.equal(symbol)
    })

    it('tracks the decimals', async ()  => {
      const result = await token.decimals()
      result.toString().should.equal(decimals)
    })

    it('tracks the total supply', async ()  => {
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply)
    })

    it('assigns the total supply to the deployer', async ()  => {
      const result = await token.balanceOf(deployer)
      result.toString().should.equal(totalSupply)
    })
  })

  // Function: transfer
  // Testing section for sending Tokens
  describe('Function transfer: sending tokens', () => {
    let result
    let amount

    // Testing section for success criterias
    describe('success', async () => {

      beforeEach(async () => {
        amount = tokens(100)
        result = await token.transfer(receiver, amount, { from: deployer })
      })

      it('transfers token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('emits a transfer event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Transfer')
        const event = log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, 'to is correct')
        event.value.toString().should.equal(amount.toString(), 'value is correct')
      })

    })

    // Testing section for failure criterias
    describe('failure', async () => {

      it('rejects invalid recipients', async () => {
        await token.transfer(0x0, amount, { from: deployer }).should.be.rejected
      })

      it('rejects insufficient balances', async () => {
        let invalidAmount
        invalidAmount = tokens(100000000) // 100 million - greater than total supply
        await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT)

        // Attempt transfer tokens, when you have none
        invalidAmount = tokens(10) // recipient has no tokens
        await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(EVM_REVERT)
      })

    })
  })

  // Function: approve
  // Testing section for approve a token to be sent from one address to another address
  // This simulates someone on an exchange
  describe('Function approve: approving tokens', () => {
    let result
    let amount

    // This is the action we are testing
    // Approve a transfer between two accounts
    beforeEach(async () => {
      amount = tokens(100)
      // Deployer is going to approve exchange for this amount
      result = await token.approve(exchange, amount, { from: deployer })
    })


    // Testing section for success criterias
    describe('success', async () => {

      it('allocates an allowance for delegated token spending on exchange', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal(amount.toString())
      })

      it('emits an Approval event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Approval')
        const event = log.args
        event.owner.toString().should.equal(deployer, 'owner is correct')
        event.spender.should.equal(exchange, 'spender is correct')
        event.value.toString().should.equal(amount.toString(), 'value is correct')
      })

    })

    // Testing section for failure criterias
    describe('failure', async () => {

      it('rejects invalid spenders', async () => {
        await token.transfer(0x0, amount, { from: deployer }).should.be.rejected
      })

    })
  })

  // Function: transferFrom 
  // Testing section to transfer from one address to another address on an exchange
  describe('Function transferFrom: delegated token transfers from one address to another address on an exchange', () => {
    let result
    let amount

    beforeEach(async () => {
      amount = tokens(100)
      await token.approve(exchange, amount, { from: deployer })
    })

    describe('success', async () => {
      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, amount, { from: exchange })
      })

      it('transfers token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('resets the allowance', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal('0')
      })

      it('emits a Transfer event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Transfer')
        const event = log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, 'to is correct')
        event.value.toString().should.equal(amount.toString(), 'value is correct')
      })

    })

    describe('failure', async () => {
      it('rejects insufficient amounts', async () => {
        // Attempt transfer too many tokens
        const invalidAmount = tokens(100000000)
        await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT)
      })

      it('rejects invalid recipients', async () => {
        await token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be.rejected
      })
    })
  })

})
