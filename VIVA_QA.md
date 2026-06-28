# 🎓 Viva Questions & Answers — Blockchain Voting System

---

## Section 1: Blockchain Basics

**Q1. Why did you use blockchain for voting instead of a normal database?**

> A normal database can be modified by whoever controls it — the admin could
> change votes. Blockchain is **decentralized and immutable** — once a vote is
> recorded via a smart contract, nobody (not even the admin) can change it.
> Every transaction is publicly verifiable.

---

**Q2. What is a smart contract?**

> A smart contract is a **self-executing program stored on a blockchain**. It
> runs automatically when predefined conditions are met, without needing a
> middleman. In our project, the `Voting.sol` contract handles all vote logic.

---

**Q3. What is Ethereum and why did you use it?**

> Ethereum is a **public blockchain platform** that supports smart contracts
> written in Solidity. We used it because:
> - Widely adopted (large community + tools)
> - Hardhat makes local development easy
> - MetaMask supports it natively

---

**Q4. What is Hardhat?**

> Hardhat is a **development environment for Ethereum**. It lets us:
> - Compile Solidity contracts
> - Run a local test blockchain (`npx hardhat node`)
> - Deploy contracts with scripts
> - Write and run automated tests

---

## Section 2: Smart Contract

**Q5. How does your system prevent double voting?**

> In `Voting.sol`, we use a mapping:
> ```solidity
> mapping(address => bool) public hasVoted;
> ```
> When someone votes, we set `hasVoted[msg.sender] = true`. Before recording
> any vote, we check `require(!hasVoted[msg.sender], "Already voted")`. Since
> each Ethereum address is unique and cryptographically secure, one wallet =
> one vote — enforced at the contract level, not the backend.

---

**Q6. What are Solidity events and why did you emit them?**

> Events are **logs stored on the blockchain** that external apps can listen to.
> We emit `VoteCast(candidateId, timestamp)` when a vote is cast. Notice we
> do **not** include the voter's address in the event — this protects voter
> privacy while still allowing transparency.

---

**Q7. What is `msg.sender` in Solidity?**

> `msg.sender` is a **global variable** in Solidity that refers to the Ethereum
> address that called the current function. In our contract, we use it to:
> - Identify the admin (set in constructor: `admin = msg.sender`)
> - Track which wallet is voting (`hasVoted[msg.sender]`)

---

**Q8. What gas optimization did you apply?**

> - Used **mappings** instead of arrays for O(1) lookups (cheaper than loops)
> - Applied **fail-fast** pattern — cheapest `require` checks first
> - Enabled Solidity **optimizer** in hardhat.config.js (`optimizer: { enabled: true, runs: 200 }`)
> - Stored **minimal data** on-chain (no strings where possible)

---

**Q9. What is a modifier in Solidity?**

> A modifier is **reusable validation code** applied to functions. Example:
> ```solidity
> modifier onlyAdmin() {
>     require(msg.sender == admin, "Only admin");
>     _;
> }
> ```
> The `_;` means "run the rest of the function here". This avoids repeating
> access control logic in every admin function.

---

## Section 3: Backend

**Q10. Why do you store some data in MongoDB if you have blockchain?**

> The blockchain stores **votes** (the sensitive, immutable data).  
> MongoDB stores **off-chain metadata** like:
> - User accounts (name, email, password)
> - Voter approval status
> - Election description
>
> Storing all this on blockchain would be expensive (gas fees) and unnecessary.
> Hybrid architecture: sensitive = blockchain, user management = database.

---

**Q11. What is JWT and why did you use it?**

> JWT (JSON Web Token) is a **stateless authentication method**. After login,
> the server issues a signed token. The client sends it with every request.
> We used it because:
> - No session storage needed on backend
> - Works well with React SPAs
> - Easy to implement and understand

---

**Q12. Why is the password hashed with bcrypt?**

> Storing plain text passwords is a critical security flaw. **Bcrypt** hashes
> the password with a salt (random string) so even if the database is leaked,
> attackers cannot recover the original passwords.

---

## Section 4: Frontend

**Q13. What is MetaMask and how does it work in your project?**

> MetaMask is a **browser extension wallet** for Ethereum. In our project:
> 1. Voter clicks "Connect MetaMask"
> 2. MetaMask provides the user's wallet address
> 3. When voting, MetaMask prompts the user to **sign and confirm** the transaction
> 4. The transaction is sent to the Hardhat local network

---

**Q14. What is ethers.js?**

> ethers.js is a **JavaScript library** for interacting with the Ethereum
> blockchain. We use it to:
> - Connect to MetaMask (`BrowserProvider`)
> - Create a contract instance (`new ethers.Contract(address, ABI, signer)`)
> - Call contract functions (read = free, write = transaction)

---

**Q15. What is the ABI?**

> ABI (Application Binary Interface) is a **JSON description of the contract's
> functions and events**. It tells ethers.js how to encode/decode calls to
> the smart contract. It's generated automatically when you compile the contract
> with Hardhat.

---

## Section 5: Security

**Q16. Can someone vote anonymously?**

> Partially. The **vote itself** (which candidate) is not linked to the voter's
> identity in the event log. However, the voter's **wallet address** is recorded
> in the `hasVoted` mapping for double-vote prevention. A determined analyst
> could link wallets to identities if they know the wallet owner. For full
> anonymity, zero-knowledge proofs (zk-SNARKs) would be used — that's beyond
> this project's scope.

---

**Q17. What are the known risks of your smart contract?**

> - **Admin key compromise**: If the admin wallet's private key is stolen, the
>   attacker can control the election. In production, use a multi-sig wallet.
> - **Front-running**: Miners could theoretically see pending vote transactions.
>   For this project scope, it's acceptable.
> - **No formal audit**: Our contract is not production-audited. It's safe for
>   academic demonstration.

---

**Q18. Why can't the admin change votes?**

> Because the `vote()` function in the smart contract only updates the
> `candidates[id].voteCount` mapping using `msg.sender` (the voter's wallet),
> and the admin has no function to modify vote counts. Even the admin wallet
> cannot call `vote()` on behalf of someone else — Ethereum transactions are
> signed, meaning only the wallet owner can initiate them.

---

## Section 6: General

**Q19. What is the difference between `view` and regular functions in Solidity?**

> - `view` functions: Read-only, **no gas cost** when called externally
> - Regular functions: Modify state, cost **gas** and create a transaction
>
> Our `getAllCandidates()` and `getElectionInfo()` are `view` — free to call.
> Our `vote()`, `startVoting()` etc. modify state — cost gas.

---

**Q20. How would you scale this for a real election?**

> - Use **Ethereum Layer 2** (like Polygon) for lower gas fees
> - Use **IPFS** for storing candidate details off-chain
> - Add **zk-proofs** for complete voter anonymity
> - Use **multi-sig governance** instead of single admin
> - Get the contract **audited** by a security firm
