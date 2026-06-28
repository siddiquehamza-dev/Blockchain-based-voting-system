const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let admin, voter1, voter2, voter3;

  // Deploy fresh contract before each test
  beforeEach(async function () {
    [admin, voter1, voter2, voter3] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  // ─────────────────────────────────────────────
  //  DEPLOYMENT TESTS
  // ─────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("Should start with voting inactive", async function () {
      expect(await voting.votingActive()).to.equal(false);
    });
  });

  // ─────────────────────────────────────────────
  //  ELECTION MANAGEMENT TESTS
  // ─────────────────────────────────────────────
  describe("Election Management", function () {
    it("Admin can create an election", async function () {
      await voting.createElection("Student Union Election 2024");
      expect(await voting.electionName()).to.equal("Student Union Election 2024");
      expect(await voting.electionCreated()).to.equal(true);
    });

    it("Non-admin cannot create election", async function () {
      await expect(
        voting.connect(voter1).createElection("Fake Election")
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Admin can add candidates", async function () {
      await voting.createElection("Test Election");
      await voting.addCandidate("Alice", "Party A");
      await voting.addCandidate("Bob", "Party B");

      expect(await voting.candidateCount()).to.equal(2);

      const candidate1 = await voting.candidates(1);
      expect(candidate1.name).to.equal("Alice");
      expect(candidate1.party).to.equal("Party A");
    });

    it("Admin can start and end voting", async function () {
      await voting.createElection("Test Election");
      await voting.addCandidate("Alice", "Party A");
      await voting.startVoting();

      expect(await voting.votingActive()).to.equal(true);

      await voting.endVoting();
      expect(await voting.votingActive()).to.equal(false);
    });

    it("Cannot start voting without candidates", async function () {
      await voting.createElection("Test Election");
      await expect(voting.startVoting()).to.be.revertedWith(
        "Add at least one candidate"
      );
    });
  });

  // ─────────────────────────────────────────────
  //  VOTING TESTS
  // ─────────────────────────────────────────────
  describe("Voting", function () {
    beforeEach(async function () {
      // Set up election with 2 candidates
      await voting.createElection("Test Election");
      await voting.addCandidate("Alice", "Party A");
      await voting.addCandidate("Bob", "Party B");
      await voting.startVoting();
    });

    it("Voter can cast a vote", async function () {
      await voting.connect(voter1).vote(1); // Vote for candidate 1 (Alice)

      const candidate1 = await voting.candidates(1);
      expect(candidate1.voteCount).to.equal(1);
      expect(await voting.totalVotes()).to.equal(1);
    });

    it("Voter cannot vote twice (double voting prevented)", async function () {
      await voting.connect(voter1).vote(1);

      // Second vote by same address should fail
      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("You have already voted");
    });

    it("Different voters can vote for different candidates", async function () {
      await voting.connect(voter1).vote(1); // Alice
      await voting.connect(voter2).vote(2); // Bob
      await voting.connect(voter3).vote(1); // Alice

      const alice = await voting.candidates(1);
      const bob = await voting.candidates(2);

      expect(alice.voteCount).to.equal(2);
      expect(bob.voteCount).to.equal(1);
      expect(await voting.totalVotes()).to.equal(3);
    });

    it("Cannot vote with invalid candidate ID", async function () {
      await expect(
        voting.connect(voter1).vote(99)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("Cannot vote when voting is not active", async function () {
      await voting.endVoting();

      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting is not active");
    });

    it("Emits VoteCast event", async function () {
      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "VoteCast")
        .withArgs(1, await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1));
    });
  });

  // ─────────────────────────────────────────────
  //  VIEW FUNCTIONS TESTS
  // ─────────────────────────────────────────────
  describe("View Functions", function () {
    it("getAllCandidates returns correct data", async function () {
      await voting.createElection("Test Election");
      await voting.addCandidate("Alice", "Party A");
      await voting.addCandidate("Bob", "Party B");

      const candidates = await voting.getAllCandidates();
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[1].name).to.equal("Bob");
    });

    it("checkIfVoted returns correct status", async function () {
      await voting.createElection("Test Election");
      await voting.addCandidate("Alice", "Party A");
      await voting.startVoting();

      expect(await voting.checkIfVoted(voter1.address)).to.equal(false);
      await voting.connect(voter1).vote(1);
      expect(await voting.checkIfVoted(voter1.address)).to.equal(true);
    });
  });
});
