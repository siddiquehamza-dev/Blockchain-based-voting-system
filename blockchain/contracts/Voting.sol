// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Voting
 * @dev A simple, secure, and transparent blockchain-based voting system.
 * 
 * KEY SECURITY FEATURES:
 * - One wallet = one vote (enforced by `hasVoted` mapping)
 * - Only admin can manage elections
 * - Votes are permanently stored on blockchain
 * - No way to link voter identity to their vote
 */
contract Voting {
    // ─────────────────────────────────────────────
    //  STATE VARIABLES
    // ─────────────────────────────────────────────

    address public admin;           // The deployer becomes admin
    string  public electionName;    // Name of the election
    bool    public votingActive;    // Is voting currently open?
    bool    public electionCreated; // Has an election been set up?

    // Candidate struct
    struct Candidate {
        uint256 id;
        string  name;
        string  party;
        uint256 voteCount;
    }

    // Mapping: candidateId => Candidate
    mapping(uint256 => Candidate) public candidates;
    uint256 public candidateCount; // Total number of candidates

    // Mapping: voterAddress => hasVoted?
    // This PREVENTS double voting at the contract level
    mapping(address => bool) public hasVoted;

    // Total votes cast so far
    uint256 public totalVotes;

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────

    // Emitted when a vote is cast (no voter info for privacy)
    event VoteCast(uint256 indexed candidateId, uint256 timestamp);

    // Emitted when election status changes
    event ElectionStatusChanged(bool isActive, string electionName);

    // Emitted when a candidate is added
    event CandidateAdded(uint256 indexed candidateId, string name, string party);

    // ─────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────

    // Only the admin can call this function
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Voting must be active
    modifier whenVotingActive() {
        require(votingActive, "Voting is not active");
        _;
    }

    // Voting must NOT be active
    modifier whenVotingNotActive() {
        require(!votingActive, "Voting is currently active");
        _;
    }

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        admin = msg.sender; // Whoever deploys becomes admin
    }

    // ─────────────────────────────────────────────
    //  ADMIN FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @dev Create a new election. Resets all previous data.
     * @param _electionName Name of the election
     */
    function createElection(string memory _electionName) public onlyAdmin whenVotingNotActive {
        require(bytes(_electionName).length > 0, "Election name cannot be empty");

        // Reset previous election data
        for (uint256 i = 1; i <= candidateCount; i++) {
            delete candidates[i];
        }
        candidateCount = 0;
        totalVotes = 0;
        electionCreated = true;
        electionName = _electionName;

        emit ElectionStatusChanged(false, _electionName);
    }

    /**
     * @dev Add a candidate to the election.
     * @param _name Candidate's name
     * @param _party Candidate's party name
     */
    function addCandidate(string memory _name, string memory _party)
        public
        onlyAdmin
        whenVotingNotActive
    {
        require(electionCreated, "Create an election first");
        require(bytes(_name).length > 0, "Candidate name cannot be empty");

        candidateCount++;
        candidates[candidateCount] = Candidate({
            id:        candidateCount,
            name:      _name,
            party:     _party,
            voteCount: 0
        });

        emit CandidateAdded(candidateCount, _name, _party);
    }

    /**
     * @dev Start the voting process.
     */
    function startVoting() public onlyAdmin {
        require(electionCreated, "Create an election first");
        require(candidateCount > 0, "Add at least one candidate");
        require(!votingActive, "Voting is already active");

        votingActive = true;
        emit ElectionStatusChanged(true, electionName);
    }

    /**
     * @dev End the voting process.
     */
    function endVoting() public onlyAdmin whenVotingActive {
        votingActive = false;
        emit ElectionStatusChanged(false, electionName);
    }

    // ─────────────────────────────────────────────
    //  VOTER FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @dev Cast a vote for a candidate.
     * @param _candidateId ID of the candidate (1-indexed)
     *
     * GAS OPTIMIZATION:
     * - Use mappings (O(1) lookup) instead of arrays
     * - Store minimal data
     * - Check conditions early (fail fast)
     */
    function vote(uint256 _candidateId) public whenVotingActive {
        // Fail fast: check if already voted FIRST (cheapest check)
        require(!hasVoted[msg.sender], "You have already voted");

        // Validate candidate ID
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");

        // Mark voter as having voted (PREVENTS DOUBLE VOTING)
        hasVoted[msg.sender] = true;

        // Increment candidate vote count
        candidates[_candidateId].voteCount++;

        // Increment total votes
        totalVotes++;

        // Emit event (only candidateId, not voter address — for privacy)
        emit VoteCast(_candidateId, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  VIEW FUNCTIONS (free to call, no gas)
    // ─────────────────────────────────────────────

    /**
     * @dev Get all candidates and their vote counts.
     * @return Array of Candidate structs
     */
    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            allCandidates[i - 1] = candidates[i];
        }
        return allCandidates;
    }

    /**
     * @dev Get election summary info.
     */
    function getElectionInfo()
        public
        view
        returns (
            string memory name,
            bool isActive,
            uint256 numCandidates,
            uint256 votes
        )
    {
        return (electionName, votingActive, candidateCount, totalVotes);
    }

    /**
     * @dev Check if a specific address has already voted.
     * @param _voter Address to check
     */
    function checkIfVoted(address _voter) public view returns (bool) {
        return hasVoted[_voter];
    }
}
