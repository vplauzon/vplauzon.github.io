---
title: Securing Azure Messaging Service Bus access
date: 2013-12-04 17:46:46 -08:00
permalink: /2013/12/04/securing-azure-messaging-service-bus-access/
categories:
- Solution
tags:
- Integration
- Security
---
<p><span style="font-family:Times New Roman;font-size:12pt;">I am currently working on a very exciting project involving systems integration across the Azure Messaging Service Bus. I thought I would share some of the painfully acquired knowledge nuggets with you. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">About %90 of examples you'll find on Internet uses Azure Bus SDK with 'owner'. That is basically 'admin' privilege because <em>owner</em> has read/write <strong>AND</strong> manage on an entire Service Bus namespace. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Although that is ok nice to get use to the SDK, but isn't a very secure setting for a production environment. Indeed, if the <em>owner</em> credentials get compromise, it would compromise the entire namespace. To top it, Microsoft recommends not to change the password &amp; symmetric key of the owner account! 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">So what is it we can do? 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">I'll give you a few guidelines here but you can read in length on this <a href="http://convective.wordpress.com/2011/10/13/on-not-using-owner-with-the-azure-appfabric-service-bus/">excellent blog post</a> or watch <a href="http://channel9.msdn.com/posts/Securing-Service-Bus-with-ACS">Clemens Vasters's video</a>. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Entities in Service Bus (i.e. Queues, Topics &amp; Subscriptions) are modelled as relying parties in a special Azure Access Control Service (ACS): the Service Bus trust that its buddy-ACS, i.e. the one having the same name with a <em>-sb</em> happened to it, as a token Issuer. So access control is going to happened in that ACS. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">You do not have access to that ACS directly, you must pass by the Service Bus page: 
</span></p><p><img src="/assets/posts/2013/4/securing-azure-messaging-service-bus-access/120513_0214_securingazu1.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Once on that ACS, you can find the <em>Service Identities</em> tab: 
</span></p><p><img src="/assets/posts/2013/4/securing-azure-messaging-service-bus-access/120513_0214_securingazu2.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">And there, you'll find our friend the <em>owner: </em>
		</span></p><p><img src="/assets/posts/2013/4/securing-azure-messaging-service-bus-access/120513_0214_securingazu3.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">So owner is actually a <em>Service Identity</em> in the buddy-ACS of the Service Bus. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Now, let's look at the relying parties: 
</span></p><p><img src="/assets/posts/2013/4/securing-azure-messaging-service-bus-access/120513_0214_securingazu4.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">As I said, Relying parties represents Service Bus' entities. Basically, any topic is the realm: 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">http://&lt;namespace&gt;.servicebus.windows/net/&lt;topic name&gt; 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">while any subscription is 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">http://&lt;namespace&gt;.servicebus.windows/net/&lt;topic name&gt;/Subscriptions/&lt;subscription name&gt; 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">But there is a twist: if you do not define a relying party corresponding exactly to you entity, ACS will look at the other relying parties, basically chopping off the right hand side of the realm until it finds a matching realm. In this case here, since I haven't define anything, the root of my namespace is the fallback realm.
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">If we click on <em>Service Bus</em>, we see the configuration of the Service Identity and at the end:
</span></p><p><img src="/assets/posts/2013/4/securing-azure-messaging-service-bus-access/120513_0227_securingazu1.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">The permissions are encoded in the rules.  A rule is basically an if-then statement:  <em>if</em> that user authenticates against this relying party, emit that claim.  For Service Bus, the only interesting claim type is <em>net.windows.servicebus.action</em>:
</span></p><p><img src="/assets/posts/2013/4/securing-azure-messaging-service-bus-access/120513_0227_securingazu2.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;"><em>
			</em></span></p><p><span style="font-family:Times New Roman;font-size:12pt;">So here you have it.  Service bus performs access control with the following steps:
</span></p><ol><li><span style="font-family:Times New Roman;font-size:12pt;">Check ACS for a relying party corresponding to the entity it's looking at
</span></li><li><span style="font-family:Times New Roman;font-size:12pt;">If that relying party can't be found, strip url parts until finding one
</span></li><li><span style="font-family:Times New Roman;font-size:12pt;">ACS runs the rules of the relying party with the Service Identity of the consumer
</span></li><li><span style="font-family:Times New Roman;font-size:12pt;">ACS returns a SWT token with claims in it
</span></li><li><span style="font-family:Times New Roman;font-size:12pt;">Service Bus looks for the claim corresponding to the action it requires to do:  Listen (receiving messages), Send &amp; Manage.
</span></li></ol><p><span style="font-family:Times New Roman;font-size:12pt;">So…  if you want to give access by a specific agent (e.g. web role) to send messages on a topic, you create a Service Identity for the agent and create a relying party corresponding to the topic.  You then enter a rule that emits a <em>Send</em> action and you should be all set.
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">This requires you to store secrets about to (Service) entity in the agents.
</span></p><p>
 </p><p><span style="font-family:Times New Roman;font-size:12pt;">Hope this very quick overview gives you some ideas.  As mentioned at the beginning, I recommend you read this <a href="http://convective.wordpress.com/2011/10/13/on-not-using-owner-with-the-azure-appfabric-service-bus/">excellent blog post</a> or watch <a href="http://channel9.msdn.com/posts/Securing-Service-Bus-with-ACS">Clemens Vasters's video</a>. 
</span></p>