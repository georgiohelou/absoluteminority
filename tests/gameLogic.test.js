const assert = require('assert');
const {
  GameStatus,
  createGame,
  joinGame,
  startGame,
  resolveRound
} = require('../src/gameLogic');

function buildGameWithPlayers(count = 6) {
  let game = createGame('Host');
  for (let i = 0; i < count - 1; i += 1) {
    game = joinGame(game, `Player ${i + 2}`);
  }
  game = startGame(game);
  return game;
}

function getPlayerIds(game) {
  return game.players.map((p) => p.id);
}

function createDeterministicPick(index = 0) {
  return (list) => list[index % list.length];
}

describe('resolveRound voting rules', () => {
  it('defaults missing votes to YES and routes to single NO case', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const votes = { [playerIds[0]]: 'NO' }; // only host voted NO, others default YES
    const { outcome } = resolveRound(game, votes, { randomPick: createDeterministicPick(1) });
    assert.strictEqual(outcome.rule, 'SINGLE_NO');
    assert.deepStrictEqual(outcome.performers, [playerIds[1]]);
  });

  it('handles majority YES with random performer selection', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const votes = { [playerIds[0]]: 'NO', [playerIds[1]]: 'NO' }; // 4 YES, 2 NO
    const { outcome } = resolveRound(game, votes, { randomPick: createDeterministicPick(1) });
    assert.strictEqual(outcome.rule, 'MAJORITY_YES');
    const yesVoters = [playerIds[2], playerIds[3], playerIds[4], playerIds[5]];
    assert.deepStrictEqual(outcome.performers, [yesVoters[1]]);
  });

  it('awards +1 to YES voters on majority NO', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const votes = {
      [playerIds[0]]: 'NO',
      [playerIds[1]]: 'NO',
      [playerIds[2]]: 'NO',
      [playerIds[3]]: 'NO',
      [playerIds[4]]: 'YES'
    }; // 4 NO, 2 YES
    const { state, outcome } = resolveRound(game, votes);
    assert.strictEqual(outcome.rule, 'MAJORITY_NO');
    const yesVoter = state.players.find((p) => p.id === playerIds[4]);
    assert.strictEqual(yesVoter.score, 1);
  });

  it('resets scores on 100% NO', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const preScored = { ...game };
    preScored.players = preScored.players.map((p) => ({ ...p, score: 3 }));
    const votes = Object.fromEntries(playerIds.map((id) => [id, 'NO']));
    const { state, outcome } = resolveRound(preScored, votes);
    assert.strictEqual(outcome.rule, 'ALL_NO');
    state.players.forEach((p) => assert.strictEqual(p.score, 0));
  });

  it('marks everyone as performers on 100% YES', () => {
    const game = buildGameWithPlayers();
    const votes = {};
    const { outcome, state } = resolveRound(game, votes, {
      performanceResults: { [game.players[0].id]: false }
    });
    assert.strictEqual(outcome.rule, 'ALL_YES');
    assert.strictEqual(outcome.performers.length, game.players.length);
    const host = state.players[0];
    assert.strictEqual(host.eliminated, true);
  });

  it('lets a single NO select performer', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const votes = { [playerIds[0]]: 'NO', [playerIds[1]]: 'YES', [playerIds[2]]: 'YES' };
    const { outcome } = resolveRound(game, votes, {
      selectPerformerForSingleNo: (_, noVoter) => {
        assert.strictEqual(noVoter.id, playerIds[0]);
        return game.players[2];
      }
    });
    assert.strictEqual(outcome.rule, 'SINGLE_NO');
    assert.deepStrictEqual(outcome.performers, [playerIds[2]]);
  });

  it('awards +2 to the lone YES voter', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const votes = Object.fromEntries(playerIds.map((id) => [id, 'NO']));
    votes[playerIds[0]] = 'YES';
    const { state, outcome } = resolveRound(game, votes);
    assert.strictEqual(outcome.rule, 'SINGLE_YES');
    const singleYes = state.players.find((p) => p.id === playerIds[0]);
    assert.strictEqual(singleYes.score, 2);
  });

  it('handles tie where YES is picked to perform', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const votes = {
      [playerIds[0]]: 'NO',
      [playerIds[1]]: 'NO',
      [playerIds[2]]: 'YES',
      [playerIds[3]]: 'YES',
      [playerIds[4]]: 'YES',
      [playerIds[5]]: 'NO'
    }; // 3 YES, 3 NO
    const { outcome } = resolveRound(game, votes, { randomPick: createDeterministicPick(2) });
    assert.strictEqual(outcome.rule, 'TIE_YES_PICKED');
    assert.deepStrictEqual(outcome.performers, [playerIds[4]]);
  });

  it('handles tie where NO is picked and grants point', () => {
    const game = buildGameWithPlayers();
    const playerIds = getPlayerIds(game);
    const votes = {
      [playerIds[0]]: 'NO',
      [playerIds[1]]: 'NO',
      [playerIds[2]]: 'YES',
      [playerIds[3]]: 'YES',
      [playerIds[4]]: 'YES',
      [playerIds[5]]: 'NO'
    }; // 3 YES, 3 NO
    const { state, outcome } = resolveRound(game, votes, {
      randomPick: createDeterministicPick(3),
      selectYesRecipientWhenNoPicker: () => game.players[2]
    });
    assert.strictEqual(outcome.rule, 'TIE_NO_PICKED');
    const recipient = state.players.find((p) => p.id === playerIds[2]);
    assert.strictEqual(recipient.score, 1);
  });

  it('declares winner when reaching five points with tie-breaker on join order', () => {
    let game = buildGameWithPlayers();
    game.players = game.players.map((p, idx) => ({ ...p, score: idx < 2 ? 5 : 0 }));
    const votes = { [game.players[0].id]: 'NO', [game.players[1].id]: 'NO' };
    const { state } = resolveRound(game, votes);
    assert.strictEqual(state.status, GameStatus.FINISHED);
    assert.strictEqual(state.winnerId, game.players[0].id);
  });
});

module.exports = { buildGameWithPlayers };
