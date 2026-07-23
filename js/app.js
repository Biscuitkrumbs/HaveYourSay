const surveyData = {
  responseType: "",

  recommendationScore: null,

  doingWell: "",
  couldImprove: "",

  culturePlan: "",
  cultureMissing: "",

  recognisedTeamMember: "",
  recognisedValue: "",
  recognitionComment: "",

  followUpRequested: false,
  respondentName: "",
};

const screenOrder = [
  "welcomeScreen",
  "recommendScreen",
  "feedbackScreen",
  "cultureScreen",
  "recognitionScreen",
  "thankYouScreen"
];

const progressByScreen = {
  welcomeScreen: 0,
  recommendScreen: 25,
  feedbackScreen: 50,
  cultureScreen: 75,
  recognitionScreen: 100,
  thankYouScreen: 100
};

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  //document.getElementById("progressBar").style.width =
    //`${progressByScreen[screenId] ?? 0}%`;

  //window.scrollTo({ top: 0, behavior: "smooth" });
}

function createNpsScale() {
  const scale = document.getElementById("npsScale");

  const continueButton = document.querySelector(
    '#recommendScreen [data-next="feedbackScreen"]'
  );

  for (let score = 0; score <= 10; score += 1) {
    const option = document.createElement("div");
    option.className = "nps-option";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "recommendationScore";
    radio.id = `nps-${score}`;
    radio.value = score;
    radio.className = "nps-radio";

    const label = document.createElement("label");
    label.htmlFor = radio.id;
    label.className = "nps-label";
    label.textContent = score;

    if (score <= 6) {
      label.classList.add("detractor");
    } else if (score <= 8) {
      label.classList.add("passive");
    } else {
      label.classList.add("promoter");
    }

    radio.addEventListener("change", () => {
      surveyData.recommendationScore = score;
      continueButton.disabled = false;
    });

    option.append(radio, label);
    scale.appendChild(option);
  }
}

function createChoiceButtons(containerId, choices, onSelect) {
  const container = document.getElementById(containerId);

  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice;

    button.addEventListener("click", () => {
      container.querySelectorAll(".choice-button").forEach((item) => {
        item.classList.toggle("selected", item === button);
      });

      onSelect(choice);
    });

    container.appendChild(button);
  });
}

function collectCurrentValues() {
  surveyData.doingWell = document.getElementById("doingWell").value.trim();
  surveyData.couldImprove = document.getElementById("couldImprove").value.trim();
  surveyData.cultureMissing = document.getElementById("cultureMissing").value.trim();
  surveyData.recognisedTeamMember = document.getElementById("teamMember").value.trim();
  surveyData.recognitionComment = document.getElementById("recognitionComment").value.trim();
  surveyData.followUpRequested = document.getElementById("followUp").checked;
  surveyData.respondentName = document.getElementById("yourName").value.trim();
}

async function submitSurvey() {
  collectCurrentValues();

  const payload = {
    timestamp: new Date().toISOString(),
    ...surveyData
  };

  if (!CONFIG.apiUrl) {
    console.table(payload);
    showScreen("thankYouScreen");
    return;
  }

  const submitButton = document.getElementById("submitButton");
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Submission failed with status ${response.status}`);
    }

    showScreen("thankYouScreen");
  } catch (error) {
    console.error(error);
    alert("We could not submit your feedback. Please try again.");
    submitButton.disabled = false;
    submitButton.textContent = "Submit feedback";
  }
}

function initialiseSurvey() {
  
  document
    .getElementById("feedbackStartButton")
    .addEventListener("click", () => {
      surveyData.responseType = "feedback";
      showScreen("recommendScreen");
    });

  document
    .getElementById("recognitionStartButton")
    .addEventListener("click", () => {
      surveyData.responseType = "recognition";
      showScreen("recognitionScreen");
    });

  document.querySelectorAll(".next-button").forEach((button) => {
    button.addEventListener("click", () => {
      collectCurrentValues();
      showScreen(button.dataset.next);
    });
  });

  document.getElementById("followUp").addEventListener("change", (event) => {
    document
      .getElementById("followUpFields")
      .classList.toggle("hidden", !event.target.checked);
  });

  document.getElementById("submitButton").addEventListener("click", submitSurvey);

  createNpsScale();

  createChoiceButtons(
    "cultureOptions",
    CONFIG.cultureOptions,
    (choice) => {
      surveyData.culturePlan = choice;
    }
  );

  createChoiceButtons(
    "valueOptions",
    CONFIG.values,
    (choice) => {
      surveyData.recognisedValue = choice;
    }
  );
}
const submitButton = document.getElementById("submitButton");

submitButton.addEventListener("click", submitSurvey);

const feedbackSubmitButton = document.getElementById("feedbackSubmitButton");

feedbackSubmitButton.addEventListener("click", submitSurvey);

async function submitSurvey() {
  const submission = {
    responseType: surveyData.responseType || "feedback",
    recommendationScore: surveyData.recommendationScore ?? "",

    doingWell: document.getElementById("doingWell").value.trim(),
    couldImprove: document.getElementById("couldImprove").value.trim(),

    cultureRating: surveyData.cultureRating || "",
    cultureMissing: document.getElementById("cultureMissing").value.trim(),

    teamMember: document.getElementById("teamMember").value.trim(),
    value: surveyData.value || "",
    recognitionComment: document
      .getElementById("recognitionComment")
      .value.trim(),

    followUpRequested: document.getElementById("followUp").checked,
    yourName: document.getElementById("yourName").value.trim(),
  
  };

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    await fetch(CONFIG.apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(submission)
    });

    showScreen("thankYouScreen");
  } catch (error) {
    console.error("Submission failed:", error);

    alert(
      "We could not submit your feedback. Please check your connection and try again."
    );

    submitButton.disabled = false;
    submitButton.textContent = "Submit feedback";
  }
}
initialiseSurvey();
