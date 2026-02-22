export function calculateMaturity(raw) {
  const model = {
    infrastructure: {
      max: 30,
      checks: [
        {
          key: "dockerfile",
          passed: raw.dockerfile === true,
          weight: 20
        },
        {
          key: "portExposure",
          passed: raw.portExposed === true, // future detection
          weight: 10
        }
      ]
    },

    cicd: {
      max: 30,
      checks: [
        {
          key: "workflow",
          passed: raw.ci === true,
          weight: 20
        },
        {
          key: "testStep",
          passed: raw.ciHasTests === true, // future detection
          weight: 10
        }
      ]
    },

    documentation: {
      max: 20,
      checks: [
        {
          key: "readme",
          passed: raw.readme === true,
          weight: 20
        }
      ]
    },

    quality: {
      max: 20,
      checks: [
        {
          key: "tests",
          passed: raw.tests === true,
          weight: 20
        }
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