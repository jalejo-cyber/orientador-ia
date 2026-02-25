// data.js — MVP de qualificacions (exemples). Escalable afegint més objectes.

window.ORIENTACIO_DATA = {
  families: {
    ADMINISTRACIO: {
      name: "Administració i gestió",
      tasks: [
        { id: "factures", label: "Facturació i comptabilitat bàsica", hint: "Factures, albarans, caixa, cobraments/pagaments" },
        { id: "arxiu", label: "Arxiu i gestió documental", hint: "Organització, registre, digitalització" },
        { id: "atencio", label: "Atenció al client", hint: "Telefonia, correu, recepció, incidències" },
        { id: "ofimatica", label: "Ofimàtica", hint: "Word/Excel, bases de dades, CRM" },
        { id: "comandes", label: "Gestió de comandes", hint: "Entrades, seguiment, coordinació amb proveïdors" },
        { id: "rrhh", label: "Suport RRHH", hint: "Documentació, altes/baixes, control horari" }
      ],
      qualifications: [
        {
          codi: "ADGG0408",
          nom: "Operacions auxiliars de serveis administratius i generals",
          nivell: 1,
          minAnys: 0.5,
          keywords: ["arxiu","documentació","oficina","correu","registre","fotocòpies","recepció"],
          taskIds: ["arxiu","atencio","ofimatica"]
        },
        {
          codi: "ADGG0208",
          nom: "Activitats administratives en la relació amb el client",
          nivell: 2,
          minAnys: 1.5,
          keywords: ["atenció","client","comandes","factures","incidències","crm","recepció"],
          taskIds: ["atencio","comandes","ofimatica","factures"]
        },
        {
          codi: "ADGD0308",
          nom: "Activitats de gestió administrativa",
          nivell: 3,
          minAnys: 2.5,
          keywords: ["gestió","procediments","comptabilitat","rrhh","organització","pressupostos"],
          taskIds: ["factures","rrhh","ofimatica","arxiu"]
        }
      ]
    },

    HOSTALERIA: {
      name: "Hostaleria i turisme",
      tasks: [
        { id: "sala", label: "Servei de sala", hint: "Comandes, servei taula, protocol, al·lèrgens" },
        { id: "barra", label: "Barra i begudes", hint: "Cafeteria, còctels bàsics, tiratge" },
        { id: "cuina", label: "Cuina", hint: "Mise en place, elaboracions, conservació" },
        { id: "higiene", label: "Higiene i APPCC", hint: "Neteja, temperatures, traçabilitat" },
        { id: "recepcio", label: "Recepció / reserves", hint: "Check-in, reserves, PMS, atenció client" },
        { id: "pissarra", label: "Gestió de comandes i estoc", hint: "Proveïdors, inventari, càmeres" }
      ],
      qualifications: [
        {
          codi: "HOTR0208",
          nom: "Operacions bàsiques de restaurant i bar",
          nivell: 1,
          minAnys: 0.5,
          keywords: ["sala","barra","cafeteria","servei","taula","neteja","al·lèrgens"],
          taskIds: ["sala","barra","higiene"]
        },
        {
          codi: "HOTR0308",
          nom: "Serveis de restaurant",
          nivell: 2,
          minAnys: 1.5,
          keywords: ["servei","protocol","comandes","vins","al·lèrgens","atenció"],
          taskIds: ["sala","higiene","barra"]
        },
        {
          codi: "HOTR0408",
          nom: "Cuina",
          nivell: 2,
          minAnys: 1.5,
          keywords: ["cuina","elaboracions","miseenplace","appcc","traçabilitat","conservació"],
          taskIds: ["cuina","higiene","pissarra"]
        },
        {
          codi: "HOTA0108",
          nom: "Direcció i producció en cuina",
          nivell: 3,
          minAnys: 2.5,
          keywords: ["organització","escandalls","costos","planificació","equips","producció"],
          taskIds: ["cuina","pissarra","higiene"]
        }
      ]
    },

    SANITAT: {
      name: "Sanitat / Atenció sociosanitària",
      tasks: [
        { id: "higiene_personal", label: "Higiene personal i suport ABVD", hint: "Bany, vestir, alimentació, mobilització" },
        { id: "mobilitzacions", label: "Mobilitzacions i transferències", hint: "Grues, canvis posturals, prevenció caigudes" },
        { id: "suport_domestic", label: "Suport a la llar", hint: "Àpats, neteja, medicació (recordatori), compres" },
        { id: "acompanyament", label: "Acompanyament i suport psicosocial", hint: "Rutines, estimulació, comunicació" },
        { id: "registres", label: "Registres i comunicació amb equip", hint: "Incidències, parts, coordinació" },
        { id: "primeres_cures", label: "Cures bàsiques", hint: "Úlceres, constants bàsiques (segons rol), higiene" }
      ],
      qualifications: [
        {
          codi: "SSCS0208",
          nom: "Atenció sociosanitària a persones dependents en institucions socials",
          nivell: 2,
          minAnys: 1.5,
          keywords: ["dependència","institució","abvd","mobilització","grua","higiene","geriatria"],
          taskIds: ["higiene_personal","mobilitzacions","acompanyament","registres"]
        },
        {
          codi: "SSCS0108",
          nom: "Atenció sociosanitària a persones en el domicili",
          nivell: 2,
          minAnys: 1.0,
          keywords: ["domicili","cures","llar","abvd","àpats","netej","acompanyament"],
          taskIds: ["suport_domestic","higiene_personal","acompanyament","registres"]
        },
        {
          codi: "SANT0108",
          nom: "Atenció sanitària a múltiples víctimes i catàstrofes (orientatiu)",
          nivell: 3,
          minAnys: 2.5,
          keywords: ["emergències","coordinació","protocols","assistència","triage"],
          taskIds: ["registres","primeres_cures"]
        }
      ]
    },

    COMERC: {
      name: "Comerç i màrqueting",
      tasks: [
        { id: "caixa", label: "Caixa i cobrament", hint: "TPV, devolucions, tancament caixa" },
        { id: "venda", label: "Venda i assessorament", hint: "Atenció, upselling, incidències" },
        { id: "repositor", label: "Reposició i lineal", hint: "Merxandatge, etiquetatge, planogrames" },
        { id: "magatzem", label: "Magatzem", hint: "Recepció mercaderia, inventari, picking" },
        { id: "comandes", label: "Comandes i proveïdors", hint: "Entrades, albarans, incidències" },
        { id: "online", label: "Venda online (bàsic)", hint: "Comandes web, devolucions, atenció digital" }
      ],
      qualifications: [
        {
          codi: "COMT0211",
          nom: "Activitats auxiliars de comerç",
          nivell: 1,
          minAnys: 0.5,
          keywords: ["reposició","lineal","magatzem","caixa","etiquetatge","atenció"],
          taskIds: ["repositor","magatzem","caixa","venda"]
        },
        {
          codi: "COMV0108",
          nom: "Activitats de venda",
          nivell: 2,
          minAnys: 1.0,
          keywords: ["venda","assessorament","client","tpv","devolucions","objectius"],
          taskIds: ["venda","caixa"]
        },
        {
          codi: "COMM0112",
          nom: "Gestió de màrqueting i comunicació (orientatiu)",
          nivell: 3,
          minAnys: 2.5,
          keywords: ["campanyes","comunicació","estratègia","rrss","analítica"],
          taskIds: ["online"]
        }
      ]
    }
  }
};
