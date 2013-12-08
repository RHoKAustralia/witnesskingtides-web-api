using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WitnessKingTides.Mobile.Web.Models
{
    public class WitnessKingTidesApiInputModel
    {
        public string Email { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Description { get; set; }

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }

        public DateTime CreationTime { get; set; }

        public string FileName { get; set; }

        public byte[] Photo { get; set; }
    }
}