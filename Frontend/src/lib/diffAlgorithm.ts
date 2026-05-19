export interface DiffToken {
    word: string;
    type: "same" | "added" | "removed";
}

export interface DiffResult {
    tokens: DiffToken[];
    added: number;
    removed: number;
}

export function lcsDiff(strA: string, strB: string): DiffResult {

    // Step 1 — split into word arrays
    const wordsA = strA.trim().split(/\s+/);
    const wordsB = strB.trim().split(/\s+/);

    const m = wordsA.length;
    const n = wordsB.length;

    // Step 2 — build empty grid (m+1) × (n+1)
    const dp: number[][] = Array.from(
        { length: m + 1 },
        () => Array(n + 1).fill(0)
    );

    // Step 3 — fill the grid
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (wordsA[i - 1] === wordsB[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;       // match → diagonal + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // no match → bigger neighbour
            }
        }
    }

    // Step 4 — backtrack and label every word
    const tokens: DiffToken[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
            tokens.unshift({ word: wordsA[i - 1], type: "same" });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            tokens.unshift({ word: wordsB[j - 1], type: "added" });
            j--;
        } else {
            tokens.unshift({ word: wordsA[i - 1], type: "removed" });
            i--;
        }
    }

    // Step 5 — count
    const added = tokens.filter(t => t.type === "added").length;
    const removed = tokens.filter(t => t.type === "removed").length;

    return { tokens, added, removed };
}