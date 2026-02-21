export function calculateMaturity(raw) {
  const model = {
    infrastructure: {
      max: 25,
      checks: [
        { key: "dockerfile", passed: raw.dockerfile, weight: 10 },
        { key: "compose", passed: false, weight: 5 }, // add detection later
        { key: "envConfig", passed: false, weight: 5 },
        { key: "portExposure", passed: false, weight: 5 }
      ]
    },
    cicd: {
      max: 25,
      checks: [
        { key: "workflow", passed: raw.ci, weight: 8 },
        { key: "testStep", passed: false, weight: 7 },
        { key: "cacheStrategy", passed: false, weight: 5 },
        { key: "separateBuildJob", passed: false, weight: 5 }
      ]
    },
    quality: {
      max: 25,
      checks: [
        { key: "testsFolder", passed: raw.tests, weight: 10 },
        { key: "lintConfig", passed: false, weight: 5 },
        { key: "buildScript", passed: false, weight: 5 },
        { key: "startScript", passed: false, weight: 5 }
      ]
    },
    documentation: {
      max: 25,
      checks: [
        { key: "readme", passed: raw.readme, weight: 10 },
        { key: "setupDocs", passed: false, weight: 5 },
        { key: "envDocs", passed: false, weight: 5 },
        { key: "deployDocs", passed: false, weight: 5 }
      ]
    }
  };

  let totalScore = 0;

  for (const categoryKey in model) {
    const category = model[categoryKey];
    let categoryScore = 0;

    category.checks.forEach(check => {
      if (check.passed) {
        categoryScore += check.weight;
      }
    });

    category.score = categoryScore;
    totalScore += categoryScore;
  }

  return {
    totalScore,
    maxScore: 100,
    categories: model
  };
}
