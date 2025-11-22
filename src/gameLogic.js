const GameStatus = {
  LOBBY: 'LOBBY',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED'
};

function createGame(hostName) {
  const hostId = generateId('player');
  const host = {
    id: hostId,
    name: hostName,
    score: 0,
    eliminated: false,
    joinOrder: 0
  };
  return {
    id: generateId('game'),
    hostId,
    status: GameStatus.LOBBY,
    players: [host],
    round: 0,
    winnerId: null
  };
}

function joinGame(gameState, name) {
  if (gameState.status !== GameStatus.LOBBY) {
    throw new Error('Cannot join once the game has started');
  }
  const player = {
    id: generateId('player'),
    name,
    score: 0,
    eliminated: false,
    joinOrder: gameState.players.length
  };
  return {
    ...gameState,
    players: [...gameState.players, player]
  };
}

function startGame(gameState) {
  if (gameState.status !== GameStatus.LOBBY) {
    throw new Error('Game already started');
  }
  if (gameState.players.length < 6) {
    throw new Error('Game requires at least 6 players to start');
  }
  return {
    ...gameState,
    status: GameStatus.IN_PROGRESS,
    round: 1
  };
}

function resolveRound(gameState, votes, options = {}) {
  if (gameState.status !== GameStatus.IN_PROGRESS) {
    throw new Error('Game is not in progress');
  }
  const randomPick = options.randomPick || pickFirst;
  const selectPerformerForSingleNo = options.selectPerformerForSingleNo || pickFirst;
  const selectYesRecipientWhenNoPicker = options.selectYesRecipientWhenNoPicker || pickFirst;
  const performanceResults = options.performanceResults || {};

  const activePlayers = gameState.players.filter((p) => !p.eliminated);
  const voteMap = ensureVotes(activePlayers, votes);
  const yesVoters = activePlayers.filter((p) => voteMap[p.id] === 'YES');
  const noVoters = activePlayers.filter((p) => voteMap[p.id] === 'NO');
  const counts = { yes: yesVoters.length, no: noVoters.length, total: activePlayers.length };

  let outcome;
  if (counts.yes === counts.total) {
    outcome = caseAllYes(activePlayers);
  } else if (counts.no === counts.total) {
    outcome = caseAllNo();
  } else if (counts.no === 1 && counts.yes === counts.total - 1) {
    outcome = caseSingleNo(yesVoters, noVoters[0], selectPerformerForSingleNo);
  } else if (counts.yes === 1 && counts.no === counts.total - 1) {
    outcome = caseSingleYes(yesVoters[0]);
  } else if (counts.yes === counts.no) {
    outcome = caseTie(yesVoters, noVoters, randomPick, selectYesRecipientWhenNoPicker);
  } else if (counts.yes > counts.no) {
    outcome = caseMajorityYes(yesVoters, randomPick);
  } else {
    outcome = caseMajorityNo(yesVoters);
  }

  const nextState = applyOutcome(gameState, outcome, performanceResults);
  return {
    outcome,
    state: nextState
  };
}

function ensureVotes(activePlayers, votes) {
  const voteMap = { ...votes };
  activePlayers.forEach((player) => {
    if (!voteMap[player.id]) {
      voteMap[player.id] = 'YES';
    }
  });
  return voteMap;
}

function caseMajorityYes(yesVoters, randomPick) {
  const chosen = randomPick(yesVoters);
  return {
    rule: 'MAJORITY_YES',
    performers: [chosen.id],
    scoreChanges: {},
    resetScores: false,
    notes: 'Random YES voter must perform the challenge.'
  };
}

function caseMajorityNo(yesVoters) {
  const scoreChanges = {};
  yesVoters.forEach((player) => {
    scoreChanges[player.id] = 1;
  });
  return {
    rule: 'MAJORITY_NO',
    performers: [],
    scoreChanges,
    resetScores: false,
    notes: 'All YES voters gain +1 point.'
  };
}

function caseAllNo() {
  return {
    rule: 'ALL_NO',
    performers: [],
    scoreChanges: {},
    resetScores: true,
    notes: 'All scores reset to 0.'
  };
}

function caseAllYes(activePlayers) {
  const performers = activePlayers.map((p) => p.id);
  return {
    rule: 'ALL_YES',
    performers,
    scoreChanges: {},
    resetScores: false,
    notes: 'Everyone must perform the challenge.'
  };
}

function caseSingleNo(yesVoters, noVoter, selector) {
  const chosen = selector(yesVoters, noVoter);
  return {
    rule: 'SINGLE_NO',
    performers: [chosen.id],
    scoreChanges: {},
    resetScores: false,
    chosenBy: noVoter.id,
    notes: 'NO voter selects a YES voter to perform the challenge.'
  };
}

function caseSingleYes(yesVoter) {
  return {
    rule: 'SINGLE_YES',
    performers: [],
    scoreChanges: { [yesVoter.id]: 2 },
    resetScores: false,
    notes: 'Single YES voter gains +2 points.'
  };
}

function caseTie(yesVoters, noVoters, randomPick, yesRecipientSelector) {
  const allVoters = [...yesVoters, ...noVoters];
  const picked = randomPick(allVoters);
  if (yesVoters.some((p) => p.id === picked.id)) {
    return {
      rule: 'TIE_YES_PICKED',
      performers: [picked.id],
      scoreChanges: {},
      resetScores: false,
      notes: 'Tie: picked YES voter performs the challenge.'
    };
  }
  const recipient = yesRecipientSelector(yesVoters, picked);
  return {
    rule: 'TIE_NO_PICKED',
    performers: [],
    scoreChanges: { [recipient.id]: 1 },
    resetScores: false,
    chosenBy: picked.id,
    notes: 'Tie: picked NO voter grants +1 point to a YES voter.'
  };
}

function applyOutcome(gameState, outcome, performanceResults) {
  const updatedPlayers = gameState.players.map((player) => ({ ...player }));

  if (outcome.resetScores) {
    updatedPlayers.forEach((p) => {
      if (!p.eliminated) {
        p.score = 0;
      }
    });
  }

  Object.entries(outcome.scoreChanges).forEach(([playerId, delta]) => {
    const player = updatedPlayers.find((p) => p.id === playerId);
    if (player && !player.eliminated) {
      player.score += delta;
    }
  });

  outcome.performers.forEach((playerId) => {
    const didSucceed = performanceResults[playerId];
    if (didSucceed === false) {
      const player = updatedPlayers.find((p) => p.id === playerId);
      if (player) {
        player.eliminated = true;
      }
    }
  });

  const winnerId = determineWinner(updatedPlayers);
  const nextStatus = winnerId ? GameStatus.FINISHED : gameState.status;

  return {
    ...gameState,
    players: updatedPlayers,
    winnerId,
    status: nextStatus,
    round: gameState.round + 1
  };
}

function determineWinner(players) {
  const contenders = players.filter((p) => !p.eliminated && p.score >= 5);
  if (!contenders.length) return null;
  contenders.sort((a, b) => {
    if (b.score === a.score) {
      return a.joinOrder - b.joinOrder;
    }
    return b.score - a.score;
  });
  return contenders[0].id;
}

function pickFirst(list) {
  return list[0];
}

let idCounter = 0;
function generateId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

module.exports = {
  GameStatus,
  createGame,
  joinGame,
  startGame,
  resolveRound,
  ensureVotes,
  determineWinner
};
