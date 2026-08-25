document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participantes inscritos</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        const participantsListElement = activityCard.querySelector(".participants-list");
        if (details.participants.length) {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";
            const participantEmail = document.createElement("span");
            participantEmail.textContent = participant;
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-participant";
            deleteButton.dataset.activity = name;
            deleteButton.dataset.email = participant;
            deleteButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            deleteButton.title = "Unregister participant";
            deleteButton.innerHTML = "&#128465;";
            participantItem.append(participantEmail, deleteButton);
            participantsListElement.appendChild(participantItem);
          });
        } else {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "no-participants";
          emptyMessage.textContent = "Nenhum participante ainda";
          participantsListElement.appendChild(emptyMessage);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant");
    if (!deleteButton) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(deleteButton.dataset.activity)}/participants/${encodeURIComponent(deleteButton.dataset.email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      messageDiv.textContent = response.ok ? result.message : result.detail || "An error occurred";
      messageDiv.className = response.ok ? "success" : "error";
      messageDiv.classList.remove("hidden");
      if (response.ok) await fetchActivities();
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
