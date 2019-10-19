---
title:  Managing Azure AD Application members in Portal
date:  2017-04-19 09:40:36 -04:00
permalink:  "/2017/04/19/managing-azure-ad-application-members-in-portal/"
categories:
- Solution
tags:
- Identity
- Security
---
One of Azure AD’s powerful concept is the application.  It gives context to an authentication as <a href="https://vincentlauzon.com/2016/03/10/azure-active-directory-application/">we explained in this article</a>.

An application can also be used as an authorization barrier since we can manage an application members.  This is optional as by default, everyone in a tenant has access to its application.  But if we opt in to control the members, only members can has access to the application, hence only members can authenticate via the application.

In this article, we’ll look at how to manage members of an application in the Portal.  We’ll discuss how to automate this in a future article.
<h2>Application Creation</h2>
First, let’s create an application.

In the Azure Active Directory (Azure AD or AAD) blade, let’s select <em>App Registrations</em>, then <em>Add</em>.

<a href="assets/2017/4/managing-azure-ad-application-members-in-portal/image6.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/4/managing-azure-ad-application-members-in-portal/image_thumb6.png" alt="image" border="0" /></a>

Let’s type the following specifications:

<a href="assets/2017/4/managing-azure-ad-application-members-in-portal/image7.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/4/managing-azure-ad-application-members-in-portal/image_thumb7.png" alt="image" border="0" /></a>
<h2>Opt in to Manage members</h2>
If we now go into the application and select <em>Managed Application in Local Directory</em>:

<a href="assets/2017/4/managing-azure-ad-application-members-in-portal/image8.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/4/managing-azure-ad-application-members-in-portal/image_thumb8.png" alt="image" border="0" /></a>

We can select the properties tab and there we can require user assignment.

<a href="assets/2017/4/managing-azure-ad-application-members-in-portal/image9.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/4/managing-azure-ad-application-members-in-portal/image_thumb9.png" alt="image" border="0" /></a>
<h2>Assigning users</h2>
We can then assign users &amp; groups (assigning groups require Azure AD Premium SKU).

<a href="assets/2017/4/managing-azure-ad-application-members-in-portal/image10.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/4/managing-azure-ad-application-members-in-portal/image_thumb10.png" alt="image" border="0" /></a>
<h2>Summary</h2>
Azure AD Application Membership, also called <em>User Assignment</em>, is a simple opt-in feature that allows us to control which user can use a given application.

It can be used as a simple (application-wide) authorization mechanism.