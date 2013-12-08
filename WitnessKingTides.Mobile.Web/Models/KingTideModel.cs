using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WitnessKingTides.Web.Api.Models
{
    public class KingTideModel
    {
        public string Location { get; set; }

        public string State { get; set; }

        public DateTime HighTideOccurs { get; set; }

        public string DateRange { get; set; }

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }
    }
}