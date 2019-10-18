---
title:  Multi-Tenant SaaS with Azure Active Directory B2B & B2C
date:  2016-03-11 04:02:09 +00:00
permalink:  "/2016/03/10/multi-tenant-saas-with-azure-active-directory-b2b-b2c/"
categories:
- Solution
tags:
- Identity
- Integration
- Security
---
<u>Scenario</u>:  I’m creating a Software as a Service (SaaS).  I’m having <strong>multiple customers</strong> &amp; I want to <strong>manage their identity</strong>.  For some of my customers the users won’t have corporate identity ; I would like to offer them to <strong>login using their social identity</strong> (e.g. Facebook) if they want to or <strong>create an account on my site</strong> otherwise.  For other customers, they’ll come in with a <strong>corporate AAD</strong> (likely synchronized with on premise AD) and I would like to integrate with that.  <strong>How do I do that in Azure</strong>?

<a href="https://azure.microsoft.com/en-us/services/active-directory/">Azure Active Directory</a> (AAD) is an <a href="https://azure.microsoft.com/en-us/documentation/articles/app-service-mobile-how-to-configure-active-directory-authentication/">Identity &amp; Access Management</a> (IAM) service in Azure.

AAD can be used in multiple numbers of ways.  You can use it as a simple identity store where you store user accounts with a given password.  You can then use it to authenticate those users against a web site or a web API.  You can have it synchronize with an on premise Active Directory, using <a href="https://azure.microsoft.com/en-gb/documentation/articles/active-directory-aadconnect/">Azure Active Directory Connect</a>.  You can enable multi-factor authentication with it.  You can use it as an identity provider for third party SaaS applications (e.g. SalesForce.com), enabling SSO.  You can also use it for on premise web applications, projecting them in the cloud, with <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-application-proxy-enable/">Application Proxy</a>.  You can enable <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-application-proxy-conditional-access/">conditional access</a> on those application proxies.

Lots of ways to use it.

Two new ways to use it, still in preview, are <a href="https://azure.microsoft.com/en-us/services/active-directory-b2c/" target="_blank">AAD B2C</a> &amp; <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2b-what-is-azure-ad-b2b/" target="_blank">AAD B2B</a>.  Both services are in preview at this time (mid-March 2016).
<h2>Business 2 Consumer</h2>
AAD B2C allows AAD to integrate with social networks:
<ul>
	<li><a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-setup-fb-app/">Facebook</a></li>
	<li><a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-setup-goog-app/">Google+</a></li>
	<li><a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-setup-msa-app/">Microsoft account</a></li>
	<li><a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-setup-amzn-app/">Amazon</a></li>
	<li><a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-setup-li-app/">LinkedIn</a></li>
</ul>
This means your AAD won’t be authenticating the users, those social networks will.  But, AAD will still be logging in the users.  This means your application integrates with only one identity provider, which in turns integrates with many.  It therefore federates identities from different sources.

<a href="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image5.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image_thumb5.png" alt="image" width="640" height="309" border="0" /></a>

You <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-reference-ui-customization/" target="_blank">stay in control</a> of the entire onboarding, login &amp; other User Experience (UX) integration with social network by customizing those UX.

AAD B2C still allows you to create “local users”, i.e. users existing solely in your AAD tenant.  This supports the scenario of “falling back” to creating accounts for your site only.  Those users can have access to a <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-reference-sspr/" target="_blank">self-service password reset</a>.

On top of that AAD B2C allows you to <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-reference-custom-attr/" target="_blank">customize the user schema</a>, i.e. adding custom attributes on top of the standard ones (e.g. Given Name, Surname, City, etc.).

Since user accounts are imported in your tenant, you can put different users coming from different social networks within AAD groups, to manage application roles for instance.

You can see an <a href="https://azure.microsoft.com/en-us/documentation/videos/azureadb2c/" target="_blank">introduction video here</a>, see the <a href="https://azure.microsoft.com/en-us/pricing/details/active-directory-b2c/" target="_blank">pricing here</a> (based on number of users &amp; number of authentications).  You should also consult the up-to-date list of <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2c-limitations/" target="_blank">known limitations here</a>.

AAD B2C is actually a special type of AAD.  You have to decide at creation if you want an AAD B2C or not.

<a href="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image6.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image_thumb6.png" alt="image" width="640" height="477" border="0" /></a>
<h2>Business 2 Business</h2>
AAD B2B allows you to bring identities from other AADs into your tenant and give them access to your applications.

This feature is free.

Currently (mid March 2016), the only to import user accounts is by using CSV files.  This is done via the “Add User” window:  simply select <em>Users in partner companies</em> in the as the type of user.

<a href="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image7.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image_thumb7.png" alt="image" width="640" height="325" border="0" /></a>

You need to supply a <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2b-references-csv-file-format/" target="_blank">CSV file with a given format</a>, i.e. with the following column names:
<ul>
	<li>Email</li>
	<li>DisplayName</li>
	<li>InviteAppID</li>
	<li>InviteReplyUrl</li>
	<li>InviteAppResources</li>
	<li>InviteGroupResources</li>
	<li>InviteContactUsUrl</li>
</ul>
The way it works is that the email you give is basically the key to find the user in the right tenant.  For instance, <a href="mailto:vince@contoso.com">vince@contoso.com</a> will use contoso.com as identity provider.  The user is then imported in your directory and its attributes are copied into it.  The only thing that remains in the foreign AAD is the authentication.

Only non-Microsoft accounts are accepted in those.

Optionally you can specify the “InviteAppID” column.  This will add the user in the given App within your tenant.

<a href="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image8.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image_thumb8.png" alt="image" width="640" height="373" border="0" /></a>

One of the advantage of importing the user account within your tenant is that you can assign it to groups within your tenant.

There is excellent documentation on this feature.  You can find a <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2b-current-preview-limitations/" target="_blank">detailed walkthrough</a> and learn about the up-to-date <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-b2b-detailed-walkthrough/" target="_blank">current limitations</a>.
<h2>Multi tenant SaaS strategy</h2>
The strategy I’m giving here leverages Azure Active Directory and isolates each of the SaaS tenant in a different tenant.

You could use one AAD tenant and throw the user accounts of all your tenants in it ; you would then solely use <a href="https://vincentlauzon.com/2016/03/10/azure-active-directory-application/">applications</a> within your AAD to segregate between your SaaS tenants.  Although this would work, it would be much harder to manage users this way.

Having separate AAD segregates your SaaS tenants more strongly.  For instance, you could wipeout an entire SaaS tenant by deleting the corresponding AAD.

Here is how it could look like.

<a href="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image9.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2016/3/multi-tenant-saas-with-azure-active-directory-b2b-b2c/image_thumb9.png" alt="image" width="640" height="269" border="0" /></a>

<strong>Cust-X &amp; Cust-Y</strong> are the same scenario:  the customers do not have a corporate AAD, hence you rely on AAD B2C to store and federate identities.  You can then use AAD groups within the AAD B2C to control user membership and implement some application roles.

<strong>Cust-Z</strong> is a scenario where the customer do have a corporate AAD and you leverage AAD B2B to import the users that will use your application.  The <strong>Cust-Z</strong> AAD tenant becomes a proxy for the corporate AAD.

A variant on this scenario is with <strong>Cust-W</strong>, where there is no proxy AAD and the <a href="https://vincentlauzon.com/2016/03/10/azure-active-directory-application/">AAD application</a> used to authenticate your application’s users is within the corporate AAD of your customer.

So when would you choose Cust-Z over Cust-W scenario?

Cust-Z allows the owner of the application (you) to create groups within the AAD proxy and include different users into it.  With Cust-W you can’t do that since you do not control the AAD.  The advantage of Cust-W scenario is that your customer can more easily control which users should access your application since that one lives within his / her AAD.
<h2>Conclusion</h2>
So there you have it, a strategy to manage identities within a multi tenant SaaS solution.

As usual with architecture, there are more than one possible ways to solve the problem, so your mileage will vary as you’ll perform different compromises.

Nevertheless, the combination of AAD B2C &amp; AAD B2B adds a lot of flexibility on how AAD can manage external identities.