# Resend Migration Checklist

## Pre-Migration Tasks

### 1. Resend Account Setup
- [ ] Create Resend account at [resend.com](https://resend.com)
- [ ] Verify your domain in Resend dashboard
- [ ] Generate API key with appropriate permissions
- [ ] Test sending emails with development domain

### 2. Environment Preparation
- [ ] Backup current SendGrid configuration
- [ ] Document current email templates and their IDs
- [ ] Note current SendGrid API key and sender email
- [ ] Plan downtime window for migration

## Migration Steps

### 3. Install Dependencies
```bash
cd apps/medusa
yarn add resend @react-email/components
yarn add -D react-email
```

### 4. Create Resend Module
- [ ] Create `src/modules/resend/` directory
- [ ] Create `src/modules/resend/service.ts`
- [ ] Create `src/modules/resend/index.ts`
- [ ] Create `src/modules/resend/emails/` directory

### 5. Create Email Templates
- [ ] Create `src/modules/resend/emails/order-placed.tsx`
- [ ] Create `src/modules/resend/emails/chef-event-requested.tsx`
- [ ] Create `src/modules/resend/emails/chef-event-accepted.tsx`
- [ ] Create `src/modules/resend/emails/chef-event-rejected.tsx`

### 6. Update Configuration
- [ ] Update `medusa-config.ts` to use Resend provider
- [ ] Add Resend environment variables to `.env`
- [ ] Remove SendGrid configuration

### 7. Update Environment Variables
```bash
# Add to .env
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev

# Remove from .env
SENDGRID_API_KEY=old_sendgrid_key
SENDGRID_FROM=old_sendgrid_from
```

### 8. Update Subscribers
- [ ] Update `src/subscribers/chef-event-requested.ts`
- [ ] Update `src/subscribers/chef-event-accepted.ts`
- [ ] Update `src/subscribers/chef-event-rejected.ts`
- [ ] Update template names in all subscribers

### 9. Test Email Templates
```bash
yarn dev:email
```
- [ ] Verify all templates render correctly
- [ ] Test with mock data
- [ ] Check email formatting across different clients

## Post-Migration Tasks

### 10. Testing
- [ ] Test order confirmation emails
- [ ] Test chef event request notifications
- [ ] Test chef event acceptance emails
- [ ] Test chef event rejection emails
- [ ] Verify email delivery in Resend dashboard

### 11. Monitoring
- [ ] Set up email delivery monitoring
- [ ] Configure bounce and complaint handling
- [ ] Set up webhooks for delivery status
- [ ] Monitor email analytics in Resend

### 12. Cleanup
- [ ] Remove SendGrid dependencies
- [ ] Remove SendGrid environment variables
- [ ] Archive old SendGrid templates
- [ ] Update documentation

## Verification Checklist

### Email Functionality
- [ ] Order confirmation emails sent successfully
- [ ] Chef event request notifications working
- [ ] Chef event acceptance emails delivered
- [ ] Chef event rejection emails sent
- [ ] All email templates render correctly

### Technical Verification
- [ ] Resend module properly registered
- [ ] Environment variables correctly set
- [ ] No SendGrid dependencies remaining
- [ ] All subscribers updated with new template names
- [ ] Email delivery confirmed in Resend dashboard

### Business Verification
- [ ] Customer receives order confirmations
- [ ] Chef receives event request notifications
- [ ] Customers receive acceptance/rejection emails
- [ ] Payment links work correctly in acceptance emails
- [ ] All email content matches business requirements

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**
   - Revert `medusa-config.ts` to SendGrid configuration
   - Restore SendGrid environment variables
   - Restart Medusa application

2. **Data Recovery**
   - Check Resend dashboard for sent emails
   - Verify no emails were lost during transition
   - Confirm all notifications were processed

3. **Investigation**
   - Review application logs for errors
   - Check Resend API response codes
   - Verify template syntax and data structure

## Performance Monitoring

### Key Metrics to Track
- [ ] Email delivery rate
- [ ] Email open rate
- [ ] Click-through rate on payment links
- [ ] Bounce rate
- [ ] Complaint rate

### Alerts to Set Up
- [ ] High bounce rate alerts
- [ ] Failed email delivery alerts
- [ ] API error rate monitoring
- [ ] Template rendering error alerts

## Documentation Updates

### Update Required Files
- [ ] Update README.md with Resend setup instructions
- [ ] Update deployment documentation
- [ ] Update environment variable documentation
- [ ] Create email template documentation

### Team Communication
- [ ] Notify team of email service change
- [ ] Update onboarding documentation
- [ ] Train team on Resend dashboard usage
- [ ] Document troubleshooting procedures

## Security Considerations

### API Key Management
- [ ] Store API key securely in environment variables
- [ ] Use different API keys for development and production
- [ ] Rotate API keys regularly
- [ ] Monitor API key usage

### Domain Security
- [ ] Verify domain ownership in Resend
- [ ] Set up proper SPF, DKIM, and DMARC records
- [ ] Monitor domain reputation
- [ ] Set up domain authentication alerts

## Cost Optimization

### Resend Pricing
- [ ] Monitor email volume usage
- [ ] Set up usage alerts
- [ ] Optimize template size and complexity
- [ ] Consider volume discounts for high usage

### Template Optimization
- [ ] Minimize template file sizes
- [ ] Optimize images and assets
- [ ] Use efficient CSS and HTML
- [ ] Test template rendering performance

## Final Checklist

### Before Going Live
- [ ] All tests passing
- [ ] Email templates approved by stakeholders
- [ ] Environment variables configured correctly
- [ ] Monitoring and alerts set up
- [ ] Team trained on new system
- [ ] Rollback plan documented

### Post-Launch Verification
- [ ] First production emails sent successfully
- [ ] Customer feedback positive
- [ ] No critical errors in logs
- [ ] Email analytics tracking properly
- [ ] All business processes working correctly

## Support Resources

### Resend Documentation
- [Resend API Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Resend Dashboard](https://resend.com/emails)

### Medusa Resources
- [Medusa Notification Module](https://docs.medusajs.com/modules/notifications)
- [Medusa Workflows](https://docs.medusajs.com/development/workflows)
- [Medusa Subscribers](https://docs.medusajs.com/development/subscribers)

### Troubleshooting
- Check Resend dashboard for delivery status
- Review application logs for errors
- Test email templates locally with React Email
- Verify environment variables are set correctly
- Confirm module registration in Medusa configuration

This checklist ensures a smooth migration from SendGrid to Resend while maintaining all email functionality in your Medusa application. 