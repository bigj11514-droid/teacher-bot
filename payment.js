const payButton = document.getElementById("pay-button");
const paymentMessage = document.getElementById("payment-message");

function readStudentSession() {
  try {
    const stored = JSON.parse(localStorage.getItem("ycohdeStudentSession"));
    if (!stored || typeof stored !== "object") return null;
    return typeof stored.email === "string" && stored.email ? stored : null;
  } catch {
    return null;
  }
}

payButton.addEventListener("click", () => {
  const student = readStudentSession();

  if (!student) {
    window.location.href = "login.html";
    return;
  }

  const paystack = new PaystackPop();

  paystack.newTransaction({
    key: "YOUR_PUBLIC_KEY",
    email: student.email,
    amount: 2500,
    planCode: "YOUR_PLAN_CODE",

    onSuccess: (transaction) => {
      /*
       * IMPORTANT:
       * Do NOT activate the student's subscription only from this callback.
       * The server must verify the reference with Paystack before granting
       * access; a client can call this callback with any reference.
       */
      fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: transaction.reference,
          email: student.email
        })
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            window.location.href = "index.html";
          } else {
            paymentMessage.textContent = "Payment could not be verified.";
          }
        })
        .catch(() => {
          paymentMessage.textContent = "Payment could not be verified.";
        });
    },

    onCancel: () => {
      paymentMessage.textContent = "Payment cancelled.";
    },

    onError: () => {
      paymentMessage.textContent = "Something went wrong with the payment.";
    }
  });
});
