// this is super weird, but number passes empty string and bigint does not
export type MediaQueries =
// For :w
`:w[${bigint}]` |
`:w[,${bigint}]` |
`:w[, ${bigint}]` |
`:w[${bigint},${bigint}]` |
`:w[${bigint}, ${bigint}]` |

// For :h
`:h[${bigint}]` |
`:h[,${bigint}]` |
`:h[, ${bigint}]` |
`:h[${bigint},${bigint}]` |
`:h[${bigint}, ${bigint}]` |

// Combinations of :w and :h
`:w[${bigint}]:h[${bigint}]` |
`:w[${bigint},${bigint}]:h[${bigint}]` |
`:w[${bigint}, ${bigint}]:h[${bigint}]` |
`:w[${bigint}]:h[${bigint},${bigint}]` |
`:w[${bigint}]:h[${bigint}, ${bigint}]` |
`:w[${bigint},${bigint}]:h[${bigint},${bigint}]` |
`:w[${bigint}, ${bigint}]:h[${bigint},${bigint}]` |
`:w[${bigint},${bigint}]:h[${bigint}, ${bigint}]` |
`:w[${bigint}, ${bigint}]:h[${bigint}, ${bigint}]` |
`:w[,${bigint}]:h[,${bigint}]` |
`:w[, ${bigint}]:h[,${bigint}]` |
`:w[,${bigint}]:h[, ${bigint}]` |
`:w[, ${bigint}]:h[, ${bigint}]` |
`:w[,${bigint}]:h[${bigint}]` |
`:w[, ${bigint}]:h[${bigint}]` |
`:w[${bigint}]:h[,${bigint}]` |
`:w[${bigint}]:h[, ${bigint}]` |
`:w[,${bigint}]:h[${bigint},${bigint}]` |
`:w[, ${bigint}]:h[${bigint},${bigint}]` |
`:w[,${bigint}]:h[${bigint}, ${bigint}]` |
`:w[, ${bigint}]:h[${bigint}, ${bigint}]` |
`:w[${bigint},${bigint}]:h[,${bigint}]` |
`:w[${bigint}, ${bigint}]:h[,${bigint}]` |
`:w[${bigint},${bigint}]:h[, ${bigint}]` |
`:w[${bigint}, ${bigint}]:h[, ${bigint}]` |

// Combinations of :h and :w
`:h[${bigint}]:w[${bigint}]` |
`:h[${bigint},${bigint}]:w[${bigint}]` |
`:h[${bigint}, ${bigint}]:w[${bigint}]` |
`:h[${bigint}]:w[${bigint},${bigint}]` |
`:h[${bigint}]:w[${bigint}, ${bigint}]` |
`:h[${bigint},${bigint}]:w[${bigint},${bigint}]` |
`:h[${bigint}, ${bigint}]:w[${bigint},${bigint}]` |
`:h[${bigint},${bigint}]:w[${bigint}, ${bigint}]` |
`:h[${bigint}, ${bigint}]:w[${bigint}, ${bigint}]` |
`:h[,${bigint}]:w[,${bigint}]` |
`:h[, ${bigint}]:w[,${bigint}]` |
`:h[,${bigint}]:w[, ${bigint}]` |
`:h[, ${bigint}]:w[, ${bigint}]` |
`:h[,${bigint}]:w[${bigint}]` |
`:h[, ${bigint}]:w[${bigint}]` |
`:h[${bigint}]:w[,${bigint}]` |
`:h[${bigint}]:w[, ${bigint}]` |
`:h[,${bigint}]:w[${bigint},${bigint}]` |
`:h[, ${bigint}]:w[${bigint},${bigint}]` |
`:h[,${bigint}]:w[${bigint}, ${bigint}]` |
`:h[, ${bigint}]:w[${bigint}, ${bigint}]` |
`:h[${bigint},${bigint}]:w[,${bigint}]` |
`:h[${bigint}, ${bigint}]:w[,${bigint}]` |
`:h[${bigint},${bigint}]:w[, ${bigint}]` |
`:h[${bigint}, ${bigint}]:w[, ${bigint}]`
