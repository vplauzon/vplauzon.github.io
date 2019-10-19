---
title: Azure Active Directory Labs Series – Create Application
date: 2016-08-31 19:00:40 -04:00
permalink: /2016/08/31/azure-active-directory-labs-series-create-application/
categories:
- Solution
tags:
- Identity
---
<img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" src="http://icons.iconarchive.com/icons/apathae/wren/128/Applications-icon.png" align="left" border="0" />Back in June I had the pleasure of delivering a training on Azure Active Directory to two customer crowds.  I say pleasure because not only do I love to share knowledge but also, the preparation of the training forces me to go deep on some aspects of what I’m going to teach.

In that training there were 8 labs and I thought it would be great to share them to the more general public.  The labs follow each other and build on each other.

You can find the exhaustive list in <a title="Azure Active Directory" href="https://vincentlauzon.com/subject-series/cloud-identity-azure-active-directory/">Cloud Identity &amp; Azure Active Directory</a> page.

In the current lab we create an Azure AD application that will be useful in future labs.  You can also read <a href="https://vincentlauzon.com/2016/03/10/azure-active-directory-application/">Azure Active Directory Application</a> to learn more about the conceptual side of applications in AAD.
<h2>Lab objectives</h2>
Create a new application in an Azure Active Directory tenant.

We will use this application in another lab to protect an Azure Web App.
<h2>Create Application</h2>
<ol>
 	<li>Go to the legacy portal @ <a href="https://manage.windowsazure.com">https://manage.windowsazure.com</a></li>
 	<li>Scroll down the left menu to the bottom and select <i>Active Directory</i>
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0022.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image002" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image002_thumb2.jpg" alt="clip_image002" width="161" height="165" border="0" /></a></li>
 	<li>You should see the following screen
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0042.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image004" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image004_thumb2.jpg" alt="clip_image004" width="531" height="102" border="0" /></a></li>
 	<li>Select a tenant you created for this lab &amp; enter it
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0062.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image006" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image006_thumb2.jpg" alt="clip_image006" width="566" height="56" border="0" /></a></li>
 	<li>Select the <i>Applications</i> sub menu
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0082.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image008" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image008_thumb2.jpg" alt="clip_image008" width="629" height="83" border="0" /></a></li>
 	<li>In the middle-bottom of the screen, click <i>ADD</i>
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0102.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image010" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image010_thumb2.jpg" alt="clip_image010" width="60" height="43" border="0" /></a></li>
 	<li>In the pop up window, select the first option
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0122.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image012" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image012_thumb2.jpg" alt="clip_image012" width="375" height="150" border="0" /></a></li>
 	<li>For the name of the application, type <i>WebDemo</i>
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0142.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image014" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image014_thumb2.jpg" alt="clip_image014" width="444" height="293" border="0" /></a></li>
 	<li>Leave the type of application to <i>Web Application and / or Web API</i></li>
 	<li>Click the next button at the bottom of the dialog</li>
 	<li>For sign-on URL, at the moment it is unimportant, so type <i>http://nowhere.com</i></li>
 	<li>For App ID URI, type uri://webdemo.mydemos
Type URI is a unique identifier within your tenant for the application ; it doesn’t need to be a URL (i.e. having a valid protocol), as we do here we prefix it with uri://</li>
 	<li>Click the check box to create the application</li>
</ol>
<h2>Limit Access to application</h2>
We will limit the access of this application to a selected group of users
<ol>
 	<li>Select the configure menu on the application
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0162.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image016" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image016_thumb2.jpg" alt="clip_image016" width="306" height="71" border="0" /></a></li>
 	<li>Scroll down until you find <i>User Assignment Requied to access App</i> and select <i>Yes</i>
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0182.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image018" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image018_thumb2.jpg" alt="clip_image018" width="416" height="152" border="0" /></a></li>
 	<li>Click the save button at the bottom of the screen</li>
 	<li>Wait for it to finish saving</li>
 	<li>Select the <i>Users</i> menu on the application
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0202.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image020" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image020_thumb2.jpg" alt="clip_image020" width="334" height="70" border="0" /></a></li>
 	<li>Select the first user, i.e. <i>Alan Scott</i></li>
 	<li>Click the assign button at the bottom of the screen
<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image0222.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image022" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image022_thumb2.jpg" alt="clip_image022" width="72" height="60" border="0" /></a></li>
 	<li>Answer yes (you want to enable access for the user)</li>
 	<li>Repeat the step for the second user, i.e. <i>Barry Allen</i></li>
 	<li>Note: with <u>Azure AD Premium</u>, you can assign groups and users</li>
</ol>
<h2>Post Lab</h2>
<ol>
 	<li>Select the configure menu on the application and look at the configuration<a href="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image023.jpg">
<img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image023" src="/assets/2016/8/azure-active-directory-labs-series-create-application/clip_image023_thumb.jpg" alt="clip_image023" width="306" height="71" border="0" /></a></li>
</ol>