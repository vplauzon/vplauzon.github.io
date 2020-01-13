---
title: Azure Active Directory Labs Series - Creating a tenant
date: 2016-08-28 15:13:02 -07:00
permalink: /2016/08/28/azure-active-directory-labs-series-creating-a-tenant/
categories:
- Solution
tags:
- Identity
---
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clinic-doctor-health-hospital1.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clinic-doctor-health-hospital" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clinic-doctor-health-hospital_thumb1.jpg" alt="clinic-doctor-health-hospital" width="430" height="286" align="right" border="0" /></a>Back in June I had the pleasure of delivering a training on Azure Active Directory to two customer crowds.  I say pleasure because not only do I love to share knowledge but also, the preparation of the training forces me to go deep on some aspects of what I’m going to teach.

In that training there were 8 labs and I thought it would be great to share them to the more general public, here they are.  This is the <strong>first</strong> of the series.

The labs follow each other and build on each other.  For instance, in the current lab we create users that will be useful in future labs.

<span style="text-decoration:underline;">UPDATE</span> (30-08-2016):  All labs will be available from the <a href="https://vincentlauzon.com/subject-series/cloud-identity-azure-active-directory/">Cloud Identity / Azure Active Directory</a> page.
<h2>Lab objectives</h2>
Create a new Azure Active Directory tenant and populates it with a few users and groups.
<h2>Creating an AAD tenant</h2>
<ol>
 	<li>Go to the legacy portal @ <a href="https://manage.windowsazure.com">https://manage.windowsazure.com</a></li>
 	<li>Scroll down the left menu to the bottom and select <i>Active Directory</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0021.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image002" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image002_thumb1.jpg" alt="clip_image002" width="161" height="165" border="0" /></a></li>
 	<li>You should see the following screen
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0041.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image004" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image004_thumb1.jpg" alt="clip_image004" width="531" height="98" border="0" /></a></li>
 	<li>At the bottom left, click the <i>+NEW</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0061.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image006" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image006_thumb1.jpg" alt="clip_image006" width="228" height="79" border="0" /></a></li>
 	<li>Select <i>Directory</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0081.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image008" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image008_thumb1.jpg" alt="clip_image008" width="390" height="149" border="0" /></a></li>
 	<li>Select <i>Custom Create</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0101.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image010" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image010_thumb1.jpg" alt="clip_image010" width="370" height="89" border="0" /></a></li>
 	<li>You should have the follow web pop up
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0121.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image012" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image012_thumb1.jpg" alt="clip_image012" width="312" height="229" border="0" /></a>
<ol type="a">
 	<li>Under Name, type a display name for the directory</li>
 	<li>Under Domain Name, enter a unique name
<ol type="i">
 	<li>The domain name doesn’t need to be the same as the display name, but of course it does help for management purposes when they are</li>
 	<li>The domain name needs to be unique throughout all Azure Active Directories of all customers since it is used in a DNS resolution</li>
 	<li>The domain name can only contain letters and numbers</li>
</ol>
</li>
 	<li>Under country or region, select your country (e.g. Canada)</li>
 	<li>Do not select B2C feature</li>
</ol>
</li>
 	<li>Your newly created directory should appear in the list as follow (vpl-2 in the example)
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0141.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image014" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image014_thumb1.jpg" alt="clip_image014" width="524" height="116" border="0" /></a></li>
</ol>
<h2>Creating users</h2>
<ol>
 	<li>Select the tenant you just created &amp; enter it
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0161.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image016" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image016_thumb1.jpg" alt="clip_image016" width="566" height="56" border="0" /></a></li>
 	<li>In the top menu, select users
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0181.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image018" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image018_thumb1.jpg" alt="clip_image018" width="561" height="43" border="0" /></a></li>
 	<li>You should already be a user of the tenant: your name should appear in the user list</li>
 	<li>At the bottom of the screen, click <i>Add User</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0201.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image020" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image020_thumb1.jpg" alt="clip_image020" width="121" height="48" border="0" /></a></li>
 	<li>In the dialog box, leave “New user in your organization” &amp; type “ballen” as the user name
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0221.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image022" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image022_thumb1.jpg" alt="clip_image022" width="240" height="111" border="0" /></a></li>
 	<li>Click for the next screen then for the first name type “Barry”, last name “Allen”, full name “Barry Allen”, leave the role as user and do not select multi-factor
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0241.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image024" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image024_thumb1.jpg" alt="clip_image024" width="386" height="267" border="0" /></a></li>
 	<li>You should get to this screen ; click <i>create</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0261.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image026" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image026_thumb1.jpg" alt="clip_image026" width="470" height="182" border="0" /></a></li>
 	<li>Copy the password somewhere: you’ll need it to log in in a later lab</li>
 	<li>Repeat the same steps for 2 more users (keep the passwords too):
<ol type="a">
 	<li>ascott, Alan Scott</li>
 	<li>hquinn, Harley Quinn</li>
</ol>
</li>
</ol>
<h2>Creating groups</h2>
<ol>
 	<li>In the top menu, select groups
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0281.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image028" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image028_thumb1.jpg" alt="clip_image028" width="401" height="43" border="0" /></a></li>
 	<li>There should be no group in your tenant</li>
 	<li>At the bottom of the screen, click <i>Add Group</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0301.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image030" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image030_thumb1.jpg" alt="clip_image030" width="106" height="71" border="0" /></a></li>
 	<li>In the dialog box, enter <i>SuperHeroes</i> for <i>Name</i> and leave the group type as <i>Security</i> ; you can leave <i>Description</i> blank
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0321.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image032" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image032_thumb1.jpg" alt="clip_image032" width="359" height="217" border="0" /></a></li>
 	<li>Create another group named <i>SuperVillains</i></li>
</ol>
<h2>Assign users to groups</h2>
<ol>
 	<li>Select the <i>SuperHeroes</i> group &amp; enter it
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0341.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image034" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image034_thumb1.jpg" alt="clip_image034" width="316" height="123" border="0" /></a></li>
 	<li>Select <i>Add Members</i>
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0361.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image036" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image036_thumb1.jpg" alt="clip_image036" width="286" height="131" border="0" /></a></li>
 	<li>For <i>Alan Scott</i>, select the plus sign
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0381.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image038" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image038_thumb1.jpg" alt="clip_image038" width="439" height="94" border="0" /></a></li>
 	<li>Do the same for Barry Allen</li>
 	<li>You should have both users in the <i>Selected</i> column
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0401.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image040" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image040_thumb1.jpg" alt="clip_image040" width="165" height="120" border="0" /></a></li>
 	<li>Accept the selection by clicking the check box at the bottom right of the dialog box</li>
 	<li>Click the back button to go back the group list
<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0421.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image042" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image042_thumb1.jpg" alt="clip_image042" width="238" height="68" border="0" /></a></li>
 	<li>Repeat the same sequence of steps, selecting the <i>SuperVillains</i> group and adding <i>Harley Quinn</i> as a member</li>
</ol>
<h3>Post Lab</h3>
You can enter inside your directory and explore each menu in the portal.

<a href="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image0441.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image044" src="/assets/posts/2016/3/azure-active-directory-labs-series-creating-a-tenant/clip_image044_thumb1.jpg" alt="clip_image044" width="753" height="47" border="0" /></a>