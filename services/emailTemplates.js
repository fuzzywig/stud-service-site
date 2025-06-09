exports.welcomeEmail = (firstName) => ({
    subject: `Welcome to MyPetConnect, ${firstName}!`,
    html: `<p>Hi ${firstName},</p><p>Thanks for joining MyPetConnect!</p><p>Start exploring stud services and pet listings today!</p>`,
});

// ✅ Correct way
const advertApproved = (userName, dogName) => ({
    subject: `Your advert for ${dogName} has been approved!`,
    html: `
    <p>Hi ${userName},</p>
    <p>Your advert for <strong>${dogName}</strong> is now live on MyPetConnect.</p>
    <p><a href="https://mypetconnect.co.uk">View your profile</a></p>
    <p>Thanks,<br/>The MyPetConnect Team</p>
  `,
});

export { advertApproved };


// You can repeat this format for:
// - advertRejected(reason)
// - reviewRejected(reason)
// - reminderDeleteWarning(dogName, daysLeft)
// - newMessageAlert(senderName, dogName)
// - passwordResetLink(link)
// - passwordChangedNotice()
// - receivedReview(dogName)
// - advertExpiryWarning(dogName)
// - newsletter(content)
