---
title:  Azure Active Directory Labs Series – Protect Web App
date:  2016-09-04 23:00:08 +00:00
permalink:  "/2016/09/04/azure-active-directory-labs-series-protect-web-app/"
categories:
- Solution
tags:
- Identity
---
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/128/Categories-applications-internet-icon.png" align="right" border="0" />Back in June I had the pleasure of delivering a training on Azure Active Directory to two customer crowds.  I say pleasure because not only do I love to share knowledge but also, the preparation of the training forces me to go deep on some aspects of what I’m going to teach.

In that training there were 8 labs and I thought it would be great to share them to the more general public.  The labs follow each other and build on each other.

You can find the exhaustive list in <a href="https://vincentlauzon.com/subject-series/cloud-identity-azure-active-directory/">Cloud Identity &amp; Azure Active Directory</a> page.

In the current lab we create an Azure Web App and force authentication against an Azure AD application (created in a previous lab) in order to access it.  You can read <a href="https://vincentlauzon.com/2016/03/11/securing-rest-api-using-azure-active-directory/">Securing REST API using Azure Active Directory</a> for something similar but with a REST API as opposed to a Web App.
<h2>Create Resource Group</h2>
<ol>
 	<li>Go to the Azure portal @ <a href="https://portal.azure.com">https://portal.azure.com</a></li>
 	<li>In the left column menu, select <i>Resource Groups</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0023.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image002" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image002_thumb3.jpg" alt="clip_image002" width="211" height="116" border="0" /></a></li>
 	<li>Select Add
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0043.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image004" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image004_thumb3.jpg" alt="clip_image004" width="192" height="104" border="0" /></a></li>
 	<li>In Resource Group name, type <i>AAD-Web-App</i> and in location, select <i>East US 2</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0063.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image006" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image006_thumb3.jpg" alt="clip_image006" width="351" height="227" border="0" /></a></li>
 	<li>Press the create button</li>
 	<li>In the resource group pane, click <i>refresh</i> until you can see your newly created group</li>
</ol>
<h2>Create App Service Plan</h2>
<ol>
 	<li>Select the newly create group</li>
 	<li>In the top menu of the resource group pane, select +<i>ADD</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0083.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image008" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image008_thumb3.jpg" alt="clip_image008" width="261" height="117" border="0" /></a></li>
 	<li>In the search box, type <i>App Service Plan</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0103.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image010" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image010_thumb3.jpg" alt="clip_image010" width="315" height="212" border="0" /></a></li>
 	<li>In the results, select the one published by Microsoft with the name <i>App Service Plan</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0123.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image012" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image012_thumb3.jpg" alt="clip_image012" width="548" height="79" border="0" /></a></li>
 	<li>Click Create</li>
 	<li>For the name of your app service plan, type <i>MyAppPlan</i>, use the existing resource group you just created and select <i>East US 2</i> as a location
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0143.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image014" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image014_thumb3.jpg" alt="clip_image014" width="425" height="548" border="0" /></a></li>
 	<li>Select <i>Pricing Tier</i></li>
 	<li>Select <i>view all</i> in the top right corner to show all pricing tier
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0163.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image016" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image016_thumb3.jpg" alt="clip_image016" width="258" height="43" border="0" /></a></li>
 	<li>Scroll down until you find <i>F1 Free</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0183.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image018" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image018_thumb3.jpg" alt="clip_image018" width="221" height="173" border="0" /></a></li>
 	<li>Select the free tier and click the select button down the pane</li>
 	<li>Press the create button in the <i>App Service Plan</i> pane</li>
</ol>
<h2>Create Web App</h2>
<ol>
 	<li>In the left column menu, select <i>Resource Groups</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image019.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image019" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image019_thumb.jpg" alt="clip_image019" width="211" height="116" border="0" /></a></li>
 	<li>Select the resource group you created, i.e. AAD-Web-App</li>
 	<li>In the top menu of the resource group pane, select +<i>ADD</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0203.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image020" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image020_thumb3.jpg" alt="clip_image020" width="261" height="117" border="0" /></a></li>
 	<li>In the search box type <i>Web App</i></li>
 	<li>In the results, select the one published by <i>Microsoft</i> with name <i>Web App</i></li>
 	<li>Click the create button</li>
 	<li>For the App name, you’ll need something unique as it is mapped to a domain name, e.g. <i>webdemovpl</i></li>
 	<li>Use the existing resource AAD-Web-App</li>
 	<li>Select the existing App Plan you created in the previous section, i.e. MyAppPlan</li>
 	<li>Press the Create button</li>
</ol>
<h2>Configure Web App</h2>
<ol>
 	<li>In the left column menu, select <i>Resource Groups</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0191.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image019[1]" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0191_thumb.jpg" alt="clip_image019[1]" width="211" height="116" border="0" /></a></li>
 	<li>Select the resource group you created, i.e. AAD-Web-App</li>
 	<li>Select the web app you just created
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0223.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image022" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image022_thumb3.jpg" alt="clip_image022" width="547" height="35" border="0" /></a></li>
 	<li>You should see the Web App pane
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0242.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image024" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image024_thumb2.jpg" alt="clip_image024" width="481" height="171" border="0" /></a></li>
 	<li>Make sure the settings are open (otherwise, click the Settings option in the menu)</li>
 	<li>In the settings pane, scroll down until the <i>Features</i> section (towards the bottom)</li>
 	<li>Click Authentication / Authorization
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0262.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image026" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image026_thumb2.jpg" alt="clip_image026" width="348" height="284" border="0" /></a></li>
 	<li>Turn the <i>App Service Authentication</i> on
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0282.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image028" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image028_thumb2.jpg" alt="clip_image028" width="151" height="46" border="0" /></a></li>
 	<li>Leave the default action there
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0302.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image030" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image030_thumb2.jpg" alt="clip_image030" width="529" height="47" border="0" /></a>
This will force user to authenticate against Azure AD when they hit you site the first time</li>
 	<li>In <i>Authentication Providers</i>, select the first provider, i.e. Azure AD
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0322.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image032" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image032_thumb2.jpg" alt="clip_image032" width="417" height="64" border="0" /></a></li>
 	<li>Select the <i>Advanced</i> option
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0342.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image034" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image034_thumb2.jpg" alt="clip_image034" width="282" height="216" border="0" /></a></li>
 	<li>The client id can be found in the Azure AD application
<ol type="a">
 	<li>In order to get your client ID, Go to the legacy portal @ <a href="https://manage.windowsazure.com">https://manage.windowsazure.com</a></li>
 	<li>Scroll down the left menu to the bottom and select <i>Active Directory</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0362.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image036" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image036_thumb2.jpg" alt="clip_image036" width="161" height="165" border="0" /></a></li>
 	<li>You should see the following screen
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0382.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image038" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image038_thumb2.jpg" alt="clip_image038" width="531" height="102" border="0" /></a></li>
 	<li>Select a tenant you created for this lab &amp; enter it
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0402.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image040" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image040_thumb2.jpg" alt="clip_image040" width="566" height="56" border="0" /></a></li>
 	<li>Select the <i>Applications</i> sub menu
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0422.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image042" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image042_thumb2.jpg" alt="clip_image042" width="629" height="89" border="0" /></a></li>
 	<li>Select the application you’ve created in a previous lab (i.e. <i>WebDemo</i>)</li>
 	<li>Select the <i>configure</i> menu within the application
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0442.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image044" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image044_thumb2.jpg" alt="clip_image044" width="306" height="71" border="0" /></a></li>
 	<li>Scroll down until you find the client ID
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image046.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image046" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image046_thumb.jpg" alt="clip_image046" width="347" height="115" border="0" /></a></li>
</ol>
</li>
 	<li>The issuer id will be the concatenation of <a href="https://sts.windows.net/">https://sts.windows.net/</a> &amp; your tenant ID
<ol type="a">
 	<li>In order to get your tenant ID, Go to the legacy portal @ <a href="https://manage.windowsazure.com">https://manage.windowsazure.com</a></li>
 	<li>Scroll down the left menu to the bottom and select <i>Active Directory</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image03611.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image036[1]" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0361_thumb.jpg" alt="clip_image036[1]" width="161" height="165" border="0" /></a></li>
 	<li>You should see the following screen
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image03811.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image038[1]" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0381_thumb.jpg" alt="clip_image038[1]" width="531" height="102" border="0" /></a></li>
 	<li>Select a tenant you created for this lab &amp; enter it
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image04011.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image040[1]" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0401_thumb.jpg" alt="clip_image040[1]" width="566" height="56" border="0" /></a></li>
 	<li>Select the <i>Applications</i> sub menu
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image04211.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image042[1]" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0421_thumb.jpg" alt="clip_image042[1]" width="629" height="89" border="0" /></a></li>
 	<li>Select the application you’ve created in a previous lab (i.e. <i>WebDemo</i>)</li>
 	<li>At the bottom of the screen select <i>View Endpoints</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image048.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image048" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image048_thumb.jpg" alt="clip_image048" width="394" height="72" border="0" /></a></li>
 	<li>In any of the text box, extract the GUID ; this is your tenant ID<i>
</i><a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image050.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image050" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image050_thumb.jpg" alt="clip_image050" width="540" height="69" border="0" /></a></li>
</ol>
</li>
 	<li>You should have filled the fields like this
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image052.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image052" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image052_thumb.jpg" alt="clip_image052" width="614" height="175" border="0" /></a></li>
 	<li>Click OK</li>
 	<li>Click Save in the <i>Authentication / Authorization</i> pane</li>
</ol>
<h2>Configure Reply URL</h2>
We need to match the application’s reply URL with the web app we just created.

When we created the AAD application we did enter <a href="http://nowhere.com">http://nowhere.com</a> because we didn’t know the web application URL.

The Reply URL will be &lt;your web app root URL&gt;/.auth/login/aad/callback (for instance <a href="https://webdemovpl.azurewebsites.net/.auth/login/aad/callback">https://webdemovpl.azurewebsites.net/.auth/login/aad/callback</a>). The App Service gateway handles the authentication for the Web App.
<ol>
 	<li>Go to the legacy portal @ <a href="https://manage.windowsazure.com">https://manage.windowsazure.com</a></li>
 	<li>Scroll down the left menu to the bottom and select <i>Active Directory</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image053.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image053" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image053_thumb.jpg" alt="clip_image053" width="161" height="165" border="0" /></a></li>
 	<li>You should see the following screen
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image054.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image054" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image054_thumb.jpg" alt="clip_image054" width="531" height="102" border="0" /></a></li>
 	<li>Select a tenant you created for this lab &amp; enter it
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image055.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image055" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image055_thumb.jpg" alt="clip_image055" width="566" height="56" border="0" /></a></li>
 	<li>Select the <i>Applications</i> sub menu
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image056.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image056" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image056_thumb.jpg" alt="clip_image056" width="629" height="89" border="0" /></a></li>
 	<li>Select the application you’ve created in a previous lab (i.e. <i>WebDemo</i>)</li>
 	<li>Select the <i>configure</i> menu within the application
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image04411.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image044[1]" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image0441_thumb.jpg" alt="clip_image044[1]" width="306" height="71" border="0" /></a></li>
 	<li>Scroll down until you find the reply url list
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image058.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image058" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image058_thumb.jpg" alt="clip_image058" width="935" height="292" border="0" /></a></li>
 	<li>Remove <a href="http://nowhere.com">http://nowhere.com</a></li>
 	<li>Add &lt;your web app root URL&gt;/.auth/login/aad/callback (for instance <a href="https://webdemovpl.azurewebsites.net/.auth/login/aad/callback">https://webdemovpl.azurewebsites.net/.auth/login/aad/callback</a>)</li>
</ol>
<h2>Deploy Web App</h2>
We could test the authentication at this point. It would land us to an empty Web app page.

<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image060.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image060" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image060_thumb.jpg" alt="clip_image060" width="439" height="288" border="0" /></a>

But instead, we’ll deploy an ASP.NET web app to have some web content.
<ol>
 	<li>Open Visual Studio 2015</li>
 	<li>Create a web application named DemoWebApp</li>
 	<li>There are two modifications to do from the vanilla template:
<ol type="a">
 	<li>Open Global.asax.cs. In method <em>Application_Start</em>, add the line <i>AntiForgeryConfig.UniqueClaimTypeIdentifier = ClaimTypes.NameIdentifier</i>
This ensures only that claim is looked up for when testing for forgery (see <a href="https://brockallen.com/2012/07/08/mvc-4-antiforgerytoken-and-claims/">https://brockallen.com/2012/07/08/mvc-4-antiforgerytoken-and-claims/</a> for details).</li>
 	<li>Open \Views\Home\Index.cshtml.  In order to output the claims, add the following HTML after &lt;h1&gt;ASP.NET&lt;/h1&gt;
<div>

[code language="html"]

&lt;h2&gt;Claims&lt;/h2&gt;


&lt;table border=”1″&gt;

&lt;thead&gt;

&lt;tr&gt;

&lt;th&gt;Issuer&lt;/th&gt;


&lt;th&gt;Type&lt;/th&gt;


&lt;th&gt;Value&lt;/th&gt;

        &lt;/tr&gt;

    &lt;/thead&gt;


&lt;tbody&gt;
        @foreach (var c in ((ClaimsIdentity)User.Identity).Claims.OrderBy(c =&gt; c.Type))
        {

&lt;tr&gt;

&lt;td&gt;@c.Issuer&lt;/td&gt;


&lt;td&gt;@c.Type&lt;/td&gt;


&lt;td&gt;@c.Value&lt;/td&gt;

            &lt;/tr&gt;

        }
    &lt;/tbody&gt;

&lt;/table&gt;

[/code]

</div></li>
</ol>
</li>
 	<li>Right click on the web project and click <i>Publish</i>…
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image062.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image062" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image062_thumb.jpg" alt="clip_image062" width="546" height="261" border="0" /></a></li>
 	<li>Select <i>Microsoft Azure App Service</i>
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image064.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image064" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image064_thumb.jpg" alt="clip_image064" width="410" height="256" border="0" /></a></li>
 	<li>Make sure to select your subscription and find the web app under the <i>AAD-Web-App</i> resource group<i>
</i><a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image066.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image066" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image066_thumb.jpg" alt="clip_image066" width="422" height="247" border="0" /></a></li>
 	<li>Select the web app</li>
 	<li>Click OK</li>
 	<li>On the connection tab, click <i>Publish</i></li>
 	<li>The project should deploy to Azure in your web app</li>
 	<li>Your web app should open in your browser</li>
 	<li>If you aren’t logged in yet, you should be invited to</li>
 	<li>You should see your user name in the top right corner</li>
 	<li>You can see the claims Azure AD provided to your web app</li>
</ol>
<h2>Test Web App</h2>
<ol>
 	<li>Open an in-private session on your browser
This will allow you to start a session afresh without Azure AD remembering your account</li>
 	<li>Navigate to your web app</li>
 	<li>You’ll be redirected to <a href="https://login.microsoftonline.com/">https://login.microsoftonline.com/</a></li>
 	<li>In <i>Email or Phone</i>, type the full user name as it appear in the Azure AD console (users tab)
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image068.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image068" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image068_thumb.jpg" alt="clip_image068" width="676" height="99" border="0" /></a>
The user name should be suffixed by <i>@&lt;name of your tenant&gt;.onmicrosoft.com</i></li>
 	<li>You’ll notice that when you <i>tab away</i> from the email textbox, the browser does an online validation. This is because Azure AD now knows in which tenant you want to login (which could be different than then tenant your application is using since you can bring users from other tenants) and it could apply policies of that tenant, e.g. requiring a PIN.</li>
 	<li>In <i>password</i>, type the password of the user you’ve copied when you created it
(If you didn’t note the password, you can reset it)</li>
 	<li>Click the sign in button
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image070.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image070" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image070_thumb.jpg" alt="clip_image070" width="318" height="257" border="0" /></a></li>
 	<li>You’ll be prompted to change your password ; do so</li>
 	<li>You’ll be redirected to your web app</li>
 	<li>You’ll see that Alan Scott is logged in &amp; you can see its claims</li>
 	<li>Repeat the same process (starting by opening a new in-private session) with the <i>Harley Quinn</i> user, which we didn’t assign to the application</li>
 	<li>You should be denied access
<a href="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image072.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="clip_image072" src="assets/2016/9/azure-active-directory-labs-series-protect-web-app/clip_image072_thumb.jpg" alt="clip_image072" width="452" height="102" border="0" /></a></li>
</ol>
<h2>Post Lab</h2>
Let’s look at a few claims sent by AAD
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th><b>Name</b></th>
<th><b>Claim Type</b></th>
<th><b>Value</b></th>
</tr>
</thead>
<tbody>
<tr>
<td>Audience</td>
<td>aud</td>
<td>The client ID of the application</td>
</tr>
<tr>
<td>Issuer</td>
<td>iss</td>
<td>The issuer Url you configured for the web app</td>
</tr>
<tr>
<td>Issued at</td>
<td>iat</td>
<td>The time at which the token was issued ; JSON time notation (i.e. integer number of seconds since January 1<sup>st</sup> 1970)</td>
</tr>
<tr>
<td>Not before</td>
<td>nbf</td>
<td>Time the token was issued (in JSON time notation)</td>
</tr>
<tr>
<td>Not on after</td>
<td>exp</td>
<td>Time when the token will be expired (in JSON time notation)</td>
</tr>
<tr>
<td>Name</td>
<td>http:/.../name</td>
<td>Full name of the account (with @&lt;directory name&gt;)</td>
</tr>
</tbody>
</table>
See <a href="https://azure.microsoft.com/en-us/documentation/articles/active-directory-token-and-claims/">https://azure.microsoft.com/en-us/documentation/articles/active-directory-token-and-claims/</a> for details.