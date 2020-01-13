---
title: Azure ACS fading away
date: 2014-03-04 16:46:00 -08:00
permalink: /2014/03/04/azure-acs-fading-away/
categories:
- Solution
tags:
- Integration
---
<p>ACS is on life support for quite a while now.&#160; It was never never fully integrated to the Azure Portal, keeping the UI it had in its <em>Azure Labs</em> day (circa 2010, for those who were born back then).</p>  <p>In an article last summer, <em><a href="http://blogs.technet.com/b/ad/archive/2013/06/22/azure-active-directory-is-the-future-of-acs.aspx">Azure Active Directory is the future of ACS</a></em>, Vittorio Bertocci announces the roadmap:&#160; the demise of ACS as Windows Azure Active Directory (WAAD) beefs up its feature set.</p>  <p>In a more <a href="http://www.cloudidentity.com/blog/2014/02/26/a-developer-preview-of-the-active-directory-authentication-library-adal-v2/">recent article</a> about <a href="http://msdn.microsoft.com/en-us/library/windowsazure/jj573266.aspx">Active Directory Authentication Library</a> (ADAL), it is explained that ACS didn’t get feature parity with WAAD on Refresh Token capabilities.&#160; So it has started.</p>  <p>For me, the big question is <a href="http://msdn.microsoft.com/en-us/library/windowsazure/ee732537.aspx">Azure Service Bus</a>.&#160; The Service Bus uses ACS as its Access Control mechanism.&#160; As I explained in a <a href="http://vincentlauzon.wordpress.com/2013/12/04/securing-azure-messaging-service-bus-access/">past blog</a>, the Service Bus has a quite elegant and granular way of securing its different entities through ACS.</p>  <p>Now, what is going to happened to that when ACS goes down?&#160; It is anyone’s guess.</p>  <p>Hopefully the same mechanisms will be transposed to WAAD.</p>