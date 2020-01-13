---
title: Office 365 Beta Service Descriptions
date: 2010-12-20 16:37:00 -08:00
permalink: /2010/12/20/office-365-beta-service-descriptions/
categories:
- Solution
tags:
- Office365
---
<p><img style="display:inline;margin-left:0;margin-right:0;" align="right" src="http://www.wegotserved.com/wp-content/uploads/2010/10/ofc365418.jpg" width="240" height="144" />Microsoft has made available the descriptions of Office 365 Beta Services:</p>  <p><a title="http://www.microsoft.com/downloads/en/details.aspx?FamilyID=6c6ecc6c-64f5-490a-bca3-8835c9a4a2ea" href="http://www.microsoft.com/downloads/en/details.aspx?FamilyID=6c6ecc6c-64f5-490a-bca3-8835c9a4a2ea">http://www.microsoft.com/downloads/en/details.aspx?FamilyID=6c6ecc6c-64f5-490a-bca3-8835c9a4a2ea</a></p>  <p>I went through the Exchange Online Services &amp; SharePoint Services.&#160; I noted the following features for Office 365 in general:</p>  <ul>   <li>Secure Access (SSL 128-bits) </li>    <li>Security Audits:      <ul>       <li><a href="http://www.27001-online.com/">ISO 27001</a> </li>        <li><a href="http://en.wikipedia.org/wiki/SAS_70">SAS70</a> Type I &amp; II audits </li>        <li>EU Safe Harbor seal </li>     </ul>   </li>    <li>High Availability (%99.9) </li>    <li>Remote Administration:&#160; many admin tasks can be performed with PowerShell scripts </li>    <li>…&#160; and my favourite:&#160; Federated Identity (through ADFS 2.0) and Single Sign On </li> </ul>  <p>The following features for Exchange Online:</p>  <ul>   <li>Mailbox sizes 500MB, 25GB &amp; Unlimited (depending on selected plan) </li>    <li>Max 25Mb of file attachment </li>    <li>Can support (depending on plan) POP, IMAP, MAPI, ActiveSync &amp; Exchange Web Services </li>    <li>Inbox Rules </li>    <li>Unified Messaging      <ul>       <li>Voicemail </li>        <li>Outlook Voice Access </li>     </ul>   </li>    <li>Outlook WebApp </li>    <li>IM &amp; Presence via either Lync Server (on premise) or Lync Services Integration </li>    <li>Sharing calendars between organizations both running on Exchange Online </li>    <li>Anti-Spam &amp; Anti-Virus Filtering      <ul>       <li>Also supports third-party filtering services on-premise </li>     </ul>   </li>    <li>Information Right Management (IRM)      <ul>       <li>Supports only integration with on-premise AD-IRM </li>     </ul>   </li>    <li>Third party apps:&#160; Exchange Services doesn’t host any custom code, it must be hosted on premise or in Windows Azure </li>    <li>Supports only Outlook 2007, Outlook 2010 &amp; Outlook for Max 2011 </li> </ul>  <p>For me, having <a href="http://vincentlauzon.wordpress.com/2010/07/09/microsoft-online-bpos/">tried Exchange Services in summer 2010</a>, it looks like the Exchange Online is maturing from an already good feature set.&#160; The show stopper for me was the lack of real single-sign on solution integrated with on-premise AD.&#160; Now that it is covered, it makes the platform quite attractive.</p>  <p>The only other problem I could see for a few enterprises, with my limited experience with Infrastructure, is the lack of support for third-party application running on Exchange Server.&#160; I know that some companies are relying on a few plug-ins running directly on Exchange Server.&#160; If that’s not your case, you may not be concerned.</p>  <p>As for SharePoint Services:</p>  <ul>   <li>Co-Authoring (multiple people working simultaneously on the same document) </li>    <li>Work offline and sync later </li>    <li>My Site, expertise sharing </li>    <li>10 Gb of base storage + 0.5Gb per enterprise user ($US 2,5 / GB / month on top of that) </li>    <li>Up to 100GB per site collection </li>    <li>Up to 5 TB per tenant </li>    <li>Support the following Mobile devices      <ul>       <li>Windows Phone 7 (both IE mobile and Office Hub) </li>        <li>Windows Mobile 6.1 + (IE mobile and Office Mobile 2010 (for 6.5.x devices)) </li>        <li>Nokia S60 3.0 +, E series and N series devices </li>        <li>Apple iPhone 3.0 + </li>        <li>Blackberry 4.2 + </li>        <li>Android 1.5 + </li>     </ul>   </li>    <li>Backups are performed every 12 hours </li>    <li>SharePoint 2010 goodies (e.g. Ribbon, Rich Text edit, etc.) </li>    <li>Sandbox solutions </li>    <li>Access Database Services </li>    <li>Visio Services </li>    <li>InfoPath Services </li> </ul>  <p>So SharePoint Services are also maturing.</p>  <p>The big problem I see with SharePoint services is for custom portals.&#160; If your company have heavily invested in SharePoint by doing custom development, those assets can’t be ported to SharePoint online in a multi-tenant mode.&#160; You would need to have your own server, which is more expensive.</p>  <p>This touches a core issue of SharePoint Services.&#160; As oppose to the other offering, SharePoint often is customized on the server-side.&#160; SharePoint wasn’t designed with multi-tenant customization in mind.&#160; The Sandbox solutions came with SharePoint 2010, but they are so limited, you can’t do much with it, left alone porting already existing app to that mode.</p>  <p>But, if you’re using SharePoint with just some branding, you’re good to go.</p>