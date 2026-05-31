const mongoose = require('./server/node_modules/mongoose');
const User = require('./server/models/User');
const FAQ = require('./server/models/FAQ');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/faq-portal');
  
  const user = await User.findOne({email:'user1@test.com'}).select('savedFAQs name');
  console.log('User:', user?.name, '| savedFAQs count:', user?.savedFAQs?.length);
  console.log('savedFAQs:', JSON.stringify(user?.savedFAQs));
  
  if (user?.savedFAQs?.length > 0) {
    const faqs = await FAQ.find({_id: {$in: user.savedFAQs}}).select('question status');
    console.log('FAQ count found:', faqs.length, '| statuses:', faqs.map(f => f.status));
  }
  
  await mongoose.disconnect();
  process.exit(0);
})();